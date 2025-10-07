import './config.js';
import fs from 'fs/promises';
import path from 'path';
import { setTimeout as wait } from 'timers/promises';
import inquirer from 'inquirer';
import cfonts from 'cfonts';
import NodeCache from '@cacheable/node-cache';
import pino from 'pino';
import makeWASocket, {
  Browsers,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from 'baileys';
import { Boom } from '@hapi/boom';
import { Client, serialize } from '#lib/serialize/index.js';
import log from '#lib/logger.js';
import printMessage from '#lib/printChatLog.js';
import PluginsLoad from '#lib/loadPlugins.js';

const SESSIONS_DIR = 'sessions';
const PLUGINS_PATH = './plugins';
const MAX_RECONNECT = 5;
const RECONNECT_STRATEGIES = Object.freeze({
  408: { action: 'restart', delay: 2000, msg: 'Connection timed out' },
  503: { action: 'restart', delay: 3000, msg: 'Service unavailable' },
  428: { action: 'restart', delay: 2000, msg: 'Connection closed' },
  500: { action: 'restart', delay: 2000, msg: 'server Error, restart' },
  515: { action: 'restart', delay: 2000, msg: 'Connection closed' },
  401: { action: 'reset', delay: 1000, msg: 'Session logged out' },
  403: { action: 'reset', delay: 1000, msg: 'Account banned' },
  405: { action: 'reset', delay: 1000, msg: 'Session not logged in' },
});

const storeLogger = pino({ level: 'fatal' });
const silentLogger = pino({ level: 'silent' });
const LOG = log;

let reconnectAttempts = 0;
let handlerModule = null;
let isPrompting = false;

const msgRetryCounterCache = new NodeCache();

const centerBanner = (text = 'EternityBot') => {
  const output = cfonts.render(text, { 
    font: 'tiny', 
    align: 'left', 
    colors: ['yellow'], 
    background: 'transparent', 
    letterSpacing: 1, 
    lineHeight: 1, 
    space: true 
  });
  const w = process.stdout.columns || 80;
  console.log(output.string.split('\n').map(l => ' '.repeat(Math.max(0, (w - l.length) >> 1)) + l).join('\n'));
};

const safeLog = {
  info: (m) => !isPrompting && LOG.info(m),
  warn: (m) => !isPrompting && LOG.warn(m),
  error: (m) => !isPrompting && LOG.error(m),
  success: (m) => !isPrompting && (LOG.success?.(m) ?? LOG.info(m)),
  fatal: (m) => LOG.fatal(m),
};

const resetSession = async () => {
  try {
    await fs.rm(SESSIONS_DIR, { recursive: true, force: true });
    LOG.info('Session reset successfully');
  } catch (err) {
    LOG.error(`Failed to remove sessions: ${err?.message ?? err}`);
  }
};

const handleReconnect = async (statusCode, startFn) => {
  const strategy = RECONNECT_STRATEGIES[statusCode];
  if (!strategy) {
    LOG.fatal(`Unhandled connection issue. Code: ${statusCode}`);
    process.exit(1);
  }
  reconnectAttempts += 1;
  if (reconnectAttempts > MAX_RECONNECT) {
    LOG.fatal('Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }
  const delay = Math.min(strategy.delay * 2 ** (reconnectAttempts - 1), 30000);
  LOG.warn(`${strategy.msg}. Reconnecting in ${delay}ms... (${reconnectAttempts}/${MAX_RECONNECT})`);
  if (strategy.action === 'reset') await resetSession();
  await wait(delay);
  return startFn();
};

const isValidGroupId = id => id && id !== 'status@broadcast' && id.endsWith('@g.us');

const getPairingNumber = async () => {
  try {
    isPrompting = true;
    console.log('\n');
    const { phoneNumber } = await inquirer.prompt([{
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
      filter: (i) => i.replace(/\D/g, ''),
      prefix: '›',
    }]);
    isPrompting = false;
    console.log('\n');
    return phoneNumber;
  } catch (err) {
    isPrompting = false;
    LOG.error(err.isTtyError ? 'Terminal tidak mendukung prompt interaktif' : `Error: ${err?.message ?? err}`);
    process.exit(1);
  }
};

async function startWA() {
  const loader = new PluginsLoad(PLUGINS_PATH, { debug: true });
  await loader.load();
  global.plugins = loader.plugins;
  
  const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  safeLog.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
  
  const conn = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, storeLogger) },
    logger: silentLogger,
    browser: Browsers.ubuntu('Edge'),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000,
    msgRetryCounterCache,
    version,
  });
  
  await Client(conn);
  conn.chats = conn.chats ?? {};
  
  if (!conn.authState.creds.registered) {
    LOG.warn('PLEASE INPUT YOUR PHONE NUMBER');
    const pairingNumber = await getPairingNumber();
    try {
      const code = await conn.requestPairingCode(pairingNumber);
      LOG.info(`Pairing Code: ${code}`);
    } catch (err) {
      LOG.error(`Failed to get pairing code: ${err?.message ?? err}`);
    }
  }
  
  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection) safeLog.info(`Connection Status: ${connection}`);
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      return handleReconnect(statusCode, startWA);
    }
    if (connection === 'open') {
      LOG.success('Bot connected successfully.');
      reconnectAttempts = 0;
      try { 
        await conn.insertAllGroup(); 
      } catch (err) { 
        safeLog.error(`Failed to insert groups: ${err?.message ?? err}`); 
      }
    }
  });
  
  conn.ev.on('creds.update', saveCreds);
  
  conn.ev.on('group-participants.update', async ({ id }) => {
    if (!isValidGroupId(id)) return;
    try {
      const metadata = await conn.groupMetadata(id);
      if (metadata) conn.chats[id] = metadata;
    } catch (err) {
      safeLog.error(`Failed to update group metadata for ${id}: ${err?.message ?? err}`);
    }
  });
  
  conn.ev.on('groups.update', async (updates) => {
    const valid = updates.filter(u => isValidGroupId(u.id));
    if (!valid.length) return;
    await Promise.allSettled(valid.map(async ({ id }) => {
      try {
        const metadata = await conn.groupMetadata(id);
        if (metadata) conn.chats[id] = metadata;
      } catch (err) {
        safeLog.error(`Failed to update group metadata for ${id}: ${err?.message ?? err}`);
      }
    }));
  });
  
  conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg || msg.messageStubType) return;
    try {
      const m = await serialize(conn, msg);
      if (m.chat.endsWith('@broadcast') || m.type === 'protocolMessage' || m.isBot) return;
      if (m.message && !isPrompting) printMessage(m, conn);
      if (!handlerModule) handlerModule = await import('./handler.js');
      await handlerModule.default(conn, m);
    } catch (err) {
      safeLog.error(`Error processing message: ${err?.message ?? err}`);
    }
  });
  
  return conn;
}

centerBanner();
startWA().catch(err => {
  LOG.fatal(`Failed to start bot: ${err?.message ?? err}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (!isPrompting) {
    LOG.error(`Uncaught Exception: ${err?.message ?? err}`);
    LOG.error(err?.stack);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  if (!isPrompting) LOG.error(`Unhandled Rejection at: ${promise}, Reason: ${reason}`);
});

const cleanup = async () => {
  LOG.info('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
