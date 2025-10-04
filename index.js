import('./config.js')

import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore
} from 'baileys'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import pino from 'pino'
import cfonts from 'cfonts';

const text = 'EternityBot';
const output = cfonts.render(text, {
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

const centered = lines.map(line => {
  const padding = Math.max(0, Math.floor((terminalWidth - line.length) / 2));
  return ' '.repeat(padding) + line;
}).join('\n');

console.log(centered);

import serialize, { Client } from '#lib/serialize.js'
import log from '#lib/logger.js'
import printMessage from "#lib/printChatLog.js"
import PluginsLoad from '#lib/loadPlugins.js'

const loader = new PluginsLoad('./plugins', { debug: true })
await loader.load()
global.plugins = loader.plugins

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState('sessions')

  const conn = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino().child({ level: 'fatal', stream: 'store' })
      )
    },
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Edge'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true
  })

  await Client(conn)

  if (!conn.chats) conn.chats = {}

  if (!conn.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(PAIRING_NUMBER, 'ETERNITY')
        log.info(`Pairing Code: ${code}`)
      } catch (err) {
        log.error(`Gagal ambil pairing code: ${err}`)
      }
    }, 3000)
  }

  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection) log.info(`Connection Status: ${connection}`)

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      switch (statusCode) {
        case 408:
          log.error('Connection timed out. Restarting...')
          await startWA()
          break
        case 503:
          log.error('Service unavailable. Restarting...')
          await startWA()
          break
        case 428:
        case 515:
          log.error('Connection closed. Restarting...')
          await startWA()
          break
        case 401:
          log.error('Session logged out. Recreate session...')
          fs.rmSync('./sessions', { recursive: true, force: true })
          await startWA()
          break
        case 403:
          log.warn('WhatsApp account banned. Recreate session...')
          fs.rmSync('./sessions', { recursive: true, force: true })
          await startWA()
          break
        case 405:
          log.warn('Session not logged in. Recreate session...')
          fs.rmSync('./sessions', { recursive: true, force: true })
          await startWA()
          break
        default:
          log.fatal(`Unhandled connection issue. Code: ${statusCode}`)
          return process.exit(1)
      }
    }

    if (connection === 'open') {
      log.success('Bot connected successfully.')
      await conn.insertAllGroup()
    }
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('group-participants.update', async ({ id }) => {
    if (!id || id === 'status@broadcast') return
    try {
      conn.chats[id] = await conn.groupMetadata(id)
    } catch (e) {
      log.error(`Gagal ambil data group ${id}: ${e}`)
    }
  })

  conn.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      const id = update.id
      if (!id || id === 'status@broadcast' || !id.endsWith('@g.us')) continue
      try {
        conn.chats[id] = await conn.groupMetadata(id)
      } catch (err) {
        log.error(`Gagal ambil data group ${id}: ${err}`)
      }
    }
  })

  conn.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages[0]) return

    const m = await serialize(conn, messages[0])

    if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) return

    if (m.message && !m.isBot) {
    if (m.type == 'protocolMessage') return
      printMessage(m, conn)
    }

    await (await import(`./handler.js?v=${Date.now()}`)).default(conn, m)
  })
}

startWA()
process.on('uncaughtException', (err) => log.error(err))
