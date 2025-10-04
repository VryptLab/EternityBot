import axios from 'axios'
import { jidNormalizedUser } from 'baileys'
import util from 'util'
import cp from 'child_process'

import Api from '#lib/api.js'
import Func from '#lib/function.js'

const exec = util.promisify(cp.exec).bind(cp)

export default async function Command(conn, m) {
  if (m.isBot) return
  
  const isOwner = m.fromMe || ownerNumber.includes(m.sender.split('@')[0])
  if (!pubelik && !isOwner) return

  const quoted = m.isQuoted ? m.quoted : m
  const isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false

  if (isOwner && ['>', '=>'].some(a => m.body?.toLowerCase().startsWith(a))) {
    return handleEval(m)
  }

  if (isOwner && m.body?.startsWith('$')) {
    return handleExec(m)
  }

  let metadata, isAdmin, isBotAdmin
  const loadGroupData = async () => {
    if (!metadata && m.isGroup) {
      metadata = conn.chats[m.chat] || await conn.groupMetadata(m.chat).catch(() => ({}))
      const botJid = jidNormalizedUser(conn.user.id)
      const userParticipant = metadata.participants?.find(u => conn.getJid(u.id) === m.sender)
      const botParticipant = metadata.participants?.find(u => conn.getJid(u.id) === botJid)
      isAdmin = userParticipant?.admin === 'admin'
      isBotAdmin = botParticipant?.admin === 'admin'
    }
  }

  const ctx = {
    Api,
    Func,
    downloadM: async (filename) => await conn.downloadMediaMessage(quoted, filename),
    quoted,
    get metadata() { return metadata },
    get isAdmin() { return isAdmin },
    get isBotAdmin() { return isBotAdmin },
    isOwner
  }

  for (const plugin of Object.values(plugins)) {
    if (typeof plugin.on === 'function') {
      try {
        const handled = await plugin.on.call(conn, m, ctx)
        if (handled) continue
      } catch (e) {
        console.error(`[PLUGIN EVENT ERROR] ${plugin.name}`, e)
      }
    }

    if (isCommand) {
      const command = m.command?.toLowerCase()
      const isCmd = plugin?.command?.includes(command) || 
                    plugin?.alias?.includes(command)

      if (!isCmd) continue

      try {
        if (plugin.settings?.owner && !isOwner) {
          return m.reply(mess.owner)
        }
        if (plugin.settings?.private && m.isGroup) {
          return m.reply(mess.private)
        }
        if (plugin.settings?.group && !m.isGroup) {
          return m.reply(mess.group)
        }
        
        if (plugin.settings?.admin || plugin.settings?.botAdmin) {
          await loadGroupData()
          
          if (plugin.settings.admin && !isAdmin) {
            return m.reply(mess.admin)
          }
          if (plugin.settings.botAdmin && !isBotAdmin) {
            return m.reply(mess.botAdmin)
          }
        }

        if (plugin.settings?.loading) m.reply(mess.wait)
        await plugin.run(conn, m, ctx)
        return
      } catch (e) {
        console.error(`[PLUGIN ERROR] ${plugin.name}`, e)
        return m.reply('Terjadi error saat menjalankan command.')
      }
    }
  }
}

async function handleEval(m) {
  let evalCmd
  try {
    evalCmd = /await/i.test(m.text)
      ? eval(`(async() => { ${m.text} })()`)
      : eval(m.text)
  } catch (e) {
    evalCmd = e
  }

  try {
    const res = await Promise.resolve(evalCmd)
    m.reply(util.format(res))
  } catch (err) {
    m.reply(util.format(err))
  }
}

async function handleExec(m) {
  let o
  try {
    o = await exec(m.text)
  } catch (e) {
    o = e
  }
  
  const { stdout = '', stderr = '' } = o || {}
  if (stdout.trim()) m.reply(stdout)
  if (stderr.trim()) m.reply(stderr)
}