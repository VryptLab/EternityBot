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
import inquirer from 'inquirer';

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

  const w = process.stdout.columns;
  console.log(output.string.split('\n').map(l => ' '.repeat(Math.max(0, (w - l.length) >> 1)) + l).join('\n'));
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
const CACHE_TTL = 300000;
const MAX_RECONNECT = 5;
const RECONNECT_STRATEGIES = Object.freeze({
  408: { action: 'restart', delay: 2000, msg: 'Connection timed out' },
  503: { action: 'restart', delay: 3000, msg: 'Service unavailable' },
  428: { action: 'restart', delay: 2000, msg: 'Connection closed' },
  515: { action: 'restart', delay: 2000, msg: 'Connection closed' },
  401: { action: 'reset', delay: 1000, msg: 'Session logged out' },
  403: { action: 'reset', delay: 1000, msg: 'Account banned' },
  405: { action: 'reset', delay: 1000, msg: 'Session not logged in' }
});

let reconnectAttempts = 0;
let handlerModule = null;
let isPrompting = false;

const resetSession = async () => {
  try {
    await fs.rm('./sessions', { recursive: true, force: true });
    log.info('Session reset successfully');
  } catch (err) {
    log.error(`Failed to remove sessions: ${err.message}`);
  }
};

const handleReconnect = async (statusCode) => {
  const strategy = RECONNECT_STRATEGIES[statusCode];
  
  if (!strategy) {
    log.fatal(`Unhandled connection issue. Code: ${statusCode}`);
    process.exit(1);
  }

  if (++reconnectAttempts > MAX_RECONNECT) {
    log.fatal('Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }

  const delay = strategy.delay * Math.pow(2, reconnectAttempts - 1);
  log.warn(`${strategy.msg}. Reconnecting in ${delay}ms... (${reconnectAttempts}/${MAX_RECONNECT})`);

  if (strategy.action === 'reset') await resetSession();

  await new Promise(resolve => setTimeout(resolve, delay));
  return startWA();
};

const fetchGroupMetadata = async (conn, groupId) => {
  const cached = groupMetadataCache.get(groupId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) return cached.data;

  try {
    const metadata = await conn.groupMetadata(groupId);
    groupMetadataCache.set(groupId, { data: metadata, timestamp: now });
    return metadata;
  } catch (err) {
    if (!isPrompting) {
      log.error(`Failed to fetch group metadata for ${groupId}: ${err.message}`);
    }
    return null;
  }
};

const isValidGroupId = (id) => id && id !== 'status@broadcast' && id.endsWith('@g.us');

const getPairingNumber = async () => {
  try {
    isPrompting = true;
    
    console.log('\n');
    
    const { phoneNumber } = await inquirer.prompt([
      {
        type: 'input',
        name: 'phoneNumber',
        message: 'Masukkan nomor WhatsApp (format: 62882xxxxxxxx):',
        validate: (input) => {
          const cleaned = input.replace(/\D/g, '');
          if (!cleaned) return 'Nomor telepon tidak boleh kosong';
          if (!cleaned.startsWith('62')) return 'Nomor harus diawali dengan 62';
          if (cleaned.length < 10 || cleaned.length > 15) return 'Panjang nomor tidak valid (10-15 digit)';
          return true;
        },
        filter: (input) => input.replace(/\D/g, ''),
        prefix: '›'
      }
    ]);
    
    isPrompting = false;
    
    console.log('\n');
    
    return phoneNumber;
  } catch (err) {
    isPrompting = false;
    log.error(err.isTtyError ? 'Terminal tidak mendukung prompt interaktif' : `Error: ${err.message}`);
    process.exit(1);
  }
};

const safeLog = {
  info: (msg) => !isPrompting && log.info(msg),
  warn: (msg) => !isPrompting && log.warn(msg),
  error: (msg) => !isPrompting && log.error(msg),
  success: (msg) => !isPrompting && log.success(msg),
  fatal: (msg) => log.fatal(msg)
};

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  safeLog.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

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
    getMessage: async () => ({ conversation: '' }),
    patchMessageBeforeSending: (msg) => msg,
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
    log.warn("PLEASE INPUT YOUR PHONR NUMBER")
    const pairingNumber = await getPairingNumber();
    
    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(pairingNumber);
        log.info(`Pairing Code: ${code}`);
      } catch (err) {
        log.error(`Failed to get pairing code: ${err.message}`);
      }
    }, 3000);
  }

  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection) safeLog.info(`Connection Status: ${connection}`);

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
        safeLog.error(`Failed to insert groups: ${err.message}`);
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
    if (!validGroups.length) return;

    await Promise.allSettled(validGroups.map(async ({ id }) => {
      const metadata = await fetchGroupMetadata(conn, id);
      if (metadata) conn.chats[id] = metadata;
    }));
  });
  
  conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg) return;

    try {
      const m = await serialize(conn, msg);
      
      if (m.chat.endsWith('@broadcast') || m.type === 'protocolMessage' || m.isBot) return;

      if (m.message && !isPrompting) printMessage(m, conn);

      if (!handlerModule) handlerModule = await import('./handler.js');
      
      await handlerModule.default(conn, m);
    } catch (err) {
      safeLog.error(`Error processing message: ${err.message}`);
    }
  });

  return conn;
}

startWA().catch(err => {
  log.fatal(`Failed to start bot: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (!isPrompting) {
    log.error(`Uncaught Exception: ${err.message}`);
    log.error(err.stack);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  if (!isPrompting) {
    log.error(`Unhandled Rejection at: ${promise}, Reason: ${reason}`);
  }
});

const cleanup = async () => {
  log.info('Shutting down gracefully...');
  groupMetadataCache.clear();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
