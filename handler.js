import axios from 'axios';
import { jidNormalizedUser } from 'baileys';
import util from 'util';
import cp from 'child_process';

import Api from '#lib/api.js';
import Func from '#lib/function.js';

const exec = util.promisify(cp.exec).bind(cp);

const ownerCache = new Set();
const groupMetadataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const initOwnerCache = () => {
  if (ownerCache.size === 0) {
    ownerNumber.forEach(num => ownerCache.add(num));
  }
};

const isOwnerUser = (sender, fromMe) => {
  if (fromMe) return true;
  initOwnerCache();
  return ownerCache.has(sender.split('@')[0]);
};

const getCachedGroupMetadata = async (conn, chatId) => {
  const cached = groupMetadataCache.get(chatId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const metadata = conn.chats[chatId] || await conn.groupMetadata(chatId);
    groupMetadataCache.set(chatId, { data: metadata, timestamp: now });
    
    if (groupMetadataCache.size > 100) {
      const oldestKey = groupMetadataCache.keys().next().value;
      groupMetadataCache.delete(oldestKey);
    }
    
    return metadata;
  } catch {
    return null;
  }
};

const getParticipantRole = (participants, jid) => {
  return participants?.find(u => u.id === jid)?.admin === 'admin';
};

export default async function Command(conn, m) {
  if (m.isBot) return;
  
  const isOwner = isOwnerUser(m.sender, m.fromMe);
  if (!pubelik && !isOwner) return;

  const quoted = m.isQuoted ? m.quoted : m;
  const body = m.body;
  const firstChar = body?.[0];

  if (isOwner && body) {
    if (firstChar === '>') {
      return handleEval(m, conn, body[1] === '=');
    }
    
    if (firstChar === '$') {
      return handleExec(m);
    }
  }

  const isCommand = m.prefix && body?.startsWith(m.prefix);
  if (!isCommand) {
    return handlePluginEvents(conn, m, quoted, isOwner);
  }

  const command = m.command?.toLowerCase();
  if (!command) return;

  await handlePluginCommand(conn, m, quoted, isOwner, command);
}

async function handlePluginEvents(conn, m, quoted, isOwner) {
  const ctx = createContext(conn, m, quoted, isOwner);
  const pluginValues = Object.values(plugins);
  
  for (const plugin of pluginValues) {
    if (typeof plugin.on === 'function') {
      try {
        if (await plugin.on.call(conn, m, ctx)) return;
      } catch (e) {
        console.error(`[PLUGIN EVENT ERROR] ${plugin.name}:`, e.message);
      }
    }
  }
}

async function handlePluginCommand(conn, m, quoted, isOwner, command) {
  let metadata, isAdmin, isBotAdmin;
  const pluginValues = Object.values(plugins);
  
  for (const plugin of pluginValues) {
    const isCmd = plugin.command?.includes(command) || plugin.alias?.includes(command);
    if (!isCmd) continue;

    try {
      const settings = plugin.settings || {};

      if (settings.owner && !isOwner) {
        return m.reply(mess.owner);
      }

      if (settings.private && m.isGroup) {
        return m.reply(mess.private);
      }

      if (settings.group && !m.isGroup) {
        return m.reply(mess.group);
      }
      
      if (settings.admin || settings.botAdmin) {
        if (!metadata) {
          metadata = await getCachedGroupMetadata(conn, m.chat);
          if (metadata) {
            const botJid = jidNormalizedUser(conn.user.id);
            isAdmin = getParticipantRole(metadata.participants, m.sender);
            isBotAdmin = getParticipantRole(metadata.participants, botJid);
          }
        }
        
        if (settings.admin && !isAdmin) {
          return m.reply(mess.admin);
        }

        if (settings.botAdmin && !isBotAdmin) {
          return m.reply(mess.botAdmin);
        }
      }

      if (settings.loading) m.reply(mess.wait);
      
      const ctx = createContext(conn, m, quoted, isOwner, metadata, isAdmin, isBotAdmin);
      await plugin.run(conn, m, ctx);
      return;
    } catch (e) {
      console.error(`[PLUGIN ERROR] ${plugin.name}:`, e.message);
      return m.reply('Terjadi error saat menjalankan command.');
    }
  }
}

function createContext(conn, m, quoted, isOwner, metadata = null, isAdmin = false, isBotAdmin = false) {
  return {
    Api,
    Func,
    downloadM: (filename) => conn.downloadMediaMessage(quoted, filename),
    quoted,
    metadata,
    isAdmin,
    isBotAdmin,
    isOwner
  };
}

async function handleEval(m, conn, isAsync) {
  const code = m.text;
  let evalCmd;
  
  try {
    evalCmd = isAsync || /await/i.test(code)
      ? eval(`(async() => { ${code} })()`)
      : eval(code);
  } catch (e) {
    return m.reply(util.format(e));
  }

  try {
    const res = await Promise.resolve(evalCmd);
    m.reply(util.format(res));
  } catch (err) {
    m.reply(util.format(err));
  }
}

async function handleExec(m) {
  const cmd = m.text.slice(1).trim();
  
  try {
    const { stdout = '', stderr = '' } = await exec(cmd, { timeout: 60000 });
    const output = stdout.trim() || stderr.trim() || 'No output';
    m.reply(output);
  } catch (e) {
    m.reply(util.format(e));
  }
}