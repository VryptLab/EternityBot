console.clear();
import './config.js';

import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from 'baileys';
import { Boom } from '@hapi/boom';
import NodeCache from '@cacheable/node-cache';
import fs from 'fs/promises';
import pino from 'pino';
import cfonts from 'cfonts';

const storeLogger = pino({ level: 'fatal', stream: 'store' });
const silentLogger = pino({ level: 'silent' });

const displayBanner = () => {
  const output = cfonts.render('EternityBot', {
    font: 'tiny',
    align: 'left',
    colors: ['yellow'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true
  });

  const terminalWidth = process.stdout.columns;
  const centered = output.string
    .split('\n')
    .map(line => ' '.repeat(Math.max(0, (terminalWidth - line.length) >> 1)) + line)
    .join('\n');

  console.log(centered);
};

displayBanner();

import { Client, serialize } from '#lib/serialize/index.js';
import log from '#lib/logger.js';
import printMessage from '#lib/printChatLog.js';
import PluginsLoad from '#lib/loadPlugins.js';

const loader = new PluginsLoad('./plugins', { debug: true });
await loader.load();
global.plugins = loader.plugins;

const msgRetryCounterCache = new NodeCache();
const groupMetadataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const RECONNECT_STRATEGIES = Object.freeze({
  408: { action: 'restart', delay: 2000, message: 'Connection timed out' },
  503: { action: 'restart', delay: 3000, message: 'Service unavailable' },
  428: { action: 'restart', delay: 2000, message: 'Connection closed' },
  515: { action: 'restart', delay: 2000, message: 'Connection closed' },
  401: { action: 'reset', delay: 1000, message: 'Session logged out' },
  403: { action: 'reset', delay: 1000, message: 'Account banned' },
  405: { action: 'reset', delay: 1000, message: 'Session not logged in' }
});

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const EXPONENTIAL_BACKOFF = true;

const resetSession = async () => {
  try {
    await fs.rm('./sessions', { recursive: true, force: true });
    log.info('Session reset successfully');
  } catch (err) {
    log.error(`Failed to remove sessions: ${err.message}`);
  }
};

const calculateDelay = (baseDelay, attempt) => {
  return EXPONENTIAL_BACKOFF 
    ? baseDelay * Math.pow(2, attempt - 1)
    : baseDelay * attempt;
};

const handleReconnect = async (statusCode) => {
  const strategy = RECONNECT_STRATEGIES[statusCode];
  
  if (!strategy) {
    log.fatal(`Unhandled connection issue. Code: ${statusCode}`);
    process.exit(1);
  }

  reconnectAttempts++;
  
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    log.fatal('Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }

  const delay = calculateDelay(strategy.delay, reconnectAttempts);
  log.warn(`${strategy.message}. Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  if (strategy.action === 'reset') {
    await resetSession();
  }

  await new Promise(resolve => setTimeout(resolve, delay));
  return startWA();
};

const fetchGroupMetadata = async (conn, groupId) => {
  const cached = groupMetadataCache.get(groupId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const metadata = await conn.groupMetadata(groupId);
    groupMetadataCache.set(groupId, { data: metadata, timestamp: now });
    return metadata;
  } catch (err) {
    log.error(`Failed to fetch group metadata for ${groupId}: ${err.message}`);
    return null;
  }
};

const isValidGroupId = (id) => id && id !== 'status@broadcast' && id.endsWith('@g.us');

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  log.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const conn = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, storeLogger)
    },
    logger: silentLogger,
    browser: Browsers.ubuntu('Edge'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000,
    emitOwnEvents: false,
    fireInitQueries: true,
    getMessage: async (key) => {
      return { conversation: '' };
    },
    patchMessageBeforeSending: (message) => {
      return message;
    },
    countryCode: 'ID',
    maxMsgRetryCount: 3,
    retryRequestDelayMs: 3000,
    syncFullHistory: false,
    msgRetryCounterCache,
    version
  });

  await Client(conn);
  conn.chats ??= {};

  if (!conn.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(PAIRING_NUMBER);
        log.info(`Pairing Code: ${code}`);
      } catch (err) {
        log.error(`Failed to get pairing code: ${err.message}`);
      }
    }, 3000);
  }

  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection) log.info(`Connection Status: ${connection}`);

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      return handleReconnect(statusCode);
    }

    if (connection === 'open') {
      log.success('Bot connected successfully.');
      reconnectAttempts = 0;
      
      try {
        await conn.insertAllGroup();
      } catch (err) {
        log.error(`Failed to insert groups: ${err.message}`);
      }
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('group-participants.update', async ({ id }) => {
    if (!isValidGroupId(id)) return;
    
    const metadata = await fetchGroupMetadata(conn, id);
    if (metadata) conn.chats[id] = metadata;
  });
  
  conn.ev.on('groups.update', async (updates) => {
    const validGroups = updates.filter(({ id }) => isValidGroupId(id));
    
    if (validGroups.length === 0) return;

    const promises = validGroups.map(async ({ id }) => {
      const metadata = await fetchGroupMetadata(conn, id);
      if (metadata) conn.chats[id] = metadata;
    });

    await Promise.allSettled(promises);
  });

  let handlerModule = null;
  
  conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg) return;

    try {
      const m = await serialize(conn, msg);
      
      if (m.chat.endsWith('@broadcast') || 
          m.type === 'protocolMessage' || 
          m.isBot) return;

      if (m.message) printMessage(m, conn);

      if (!handlerModule) {
        handlerModule = await import('./handler.js');
      }
      
      await handlerModule.default(conn, m);
    } catch (err) {
      log.error(`Error processing message: ${err.message}`);
    }
  });

  return conn;
}

startWA().catch(err => {
  log.fatal(`Failed to start bot: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  log.error(`Uncaught Exception: ${err.message}`);
  log.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}`);
  log.error(`Reason: ${reason}`);
});

process.on('SIGINT', async () => {
  log.info('Shutting down gracefully...');
  groupMetadataCache.clear();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Shutting down gracefully...');
  groupMetadataCache.clear();
  process.exit(0);
});