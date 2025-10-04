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
import fs from 'fs';
import pino from 'pino';
import cfonts from 'cfonts';

const storeLogger = pino().child({ level: 'fatal', stream: 'store' });
const silentLogger = pino({ level: 'silent' });

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
const lines = output.string.split('\n');
const centered = lines
  .map(line => ' '.repeat(Math.max(0, (terminalWidth - line.length) >> 1)) + line)
  .join('\n');

console.log(centered);

import { Client, serialize } from '#lib/serialize/index.js';
import log from '#lib/logger.js';
import printMessage from '#lib/printChatLog.js';
import PluginsLoad from '#lib/loadPlugins.js';

const loader = new PluginsLoad('./plugins', { debug: true });
await loader.load();
global.plugins = loader.plugins;

const msgRetryCounterCache = new NodeCache();

const RECONNECT_STRATEGIES = {
  408: { action: 'restart', delay: 2000, message: 'Connection timed out' },
  503: { action: 'restart', delay: 3000, message: 'Service unavailable' },
  428: { action: 'restart', delay: 2000, message: 'Connection closed' },
  515: { action: 'restart', delay: 2000, message: 'Connection closed' },
  401: { action: 'reset', delay: 1000, message: 'Session logged out' },
  403: { action: 'reset', delay: 1000, message: 'Account banned' },
  405: { action: 'reset', delay: 1000, message: 'Session not logged in' }
};

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_DELAY = 2000;

async function resetSession() {
  try {
    await fs.promises.rm('./sessions', { recursive: true, force: true });
  } catch (err) {
    log.error(`Failed to remove sessions: ${err.message}`);
  }
}

async function handleReconnect(statusCode) {
  const strategy = RECONNECT_STRATEGIES[statusCode];
  
  if (!strategy) {
    log.fatal(`Unhandled connection issue. Code: ${statusCode}`);
    return process.exit(1);
  }

  reconnectAttempts++;
  
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    log.fatal('Max reconnection attempts reached. Exiting...');
    return process.exit(1);
  }

  const delay = strategy.delay * reconnectAttempts;
  log.warn(`${strategy.message}. Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  if (strategy.action === 'reset') {
    await resetSession();
  }

  await new Promise(resolve => setTimeout(resolve, delay));
  return startWA();
}

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
    keepAliveIntervalMs: 5000,
    countryCode: 'ID',
    maxMsgRetryCount: 3,
    retryRequestDelayMs: 3000,
    msgRetryCounterCache,
    version
  });

  await Client(conn);

  conn.chats ??= {};

  if (!conn.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(PAIRING_NUMBER, 'ETERNITY');
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
      await conn.insertAllGroup();
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('group-participants.update', async ({ id }) => {
    if (!id || id === 'status@broadcast') return;
    
    try {
      conn.chats[id] = await conn.groupMetadata(id);
    } catch (err) {
      log.error(`Failed to fetch group data ${id}: ${err.message}`);
    }
  });
  
  conn.ev.on('groups.update', async (updates) => {
    const promises = updates
      .filter(({ id }) => id && id !== 'status@broadcast' && id.endsWith('@g.us'))
      .map(async ({ id }) => {
        try {
          conn.chats[id] = await conn.groupMetadata(id);
        } catch (err) {
          log.error(`Failed to fetch group data ${id}: ${err.message}`);
        }
      });

    await Promise.allSettled(promises);
  });

  conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg) return;

    const m = await serialize(conn, msg);
    
    if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) return;
    
    if (m.type === 'protocolMessage' || m.isBot) return;

    if (m.message) {
      printMessage(m, conn);
    }

    const handler = await import(`./handler.js?v=${Date.now()}`);
    await handler.default(conn, m);
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