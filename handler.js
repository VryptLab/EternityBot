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
  ownerNumber.forEach(num => ownerCache.add(num));
};

const isOwnerUser = (sender, fromMe) => {
  if (fromMe) return true;
  if (ownerCache.size === 0) initOwnerCache();
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
  const isCommand = m.prefix && m.body?.startsWith(m.prefix);

  if (isOwner && m.body) {
    const firstChar = m.body[0];
    const secondChar = m.body[1];
    
    if (firstChar === '>') {
      return handleEval(m, secondChar === '=');
    }
    
    if (firstChar === '$') {
      return handleExec(m);
    }
  }

  let metadata, isAdmin, isBotAdmin, groupDataLoaded = false;

  const loadGroupData = async () => {
    if (groupDataLoaded || !m.isGroup) return;
    
    metadata = await getCachedGroupMetadata(conn, m.chat);
    if (!metadata) return;

    const botJid = jidNormalizedUser(conn.user.id);
    isAdmin = getParticipantRole(metadata.participants, m.sender);
    isBotAdmin = getParticipantRole(metadata.participants, botJid);
    groupDataLoaded = true;
  };

  const ctx = {
    Api,
    Func,
    downloadM: (filename) => conn.downloadMediaMessage(quoted, filename),
    quoted,
    get metadata() { return metadata; },
    get isAdmin() { return isAdmin; },
    get isBotAdmin() { return isBotAdmin; },
    isOwner
  };

  const pluginValues = Object.values(plugins);
  
  for (let i = 0; i < pluginValues.length; i++) {
    const plugin = pluginValues[i];
    
    if (typeof plugin.on === 'function') {
      try {
        if (await plugin.on.call(conn, m, ctx)) continue;
      } catch (e) {
        console.error(`[PLUGIN EVENT ERROR] ${plugin.name}:`, e.message);
      }
    }

    if (!isCommand) continue;

    const command = m.command?.toLowerCase();
    if (!command) continue;

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
        await loadGroupData();
        
        if (settings.admin && !isAdmin) {
          return m.reply(mess.admin);
        }

        if (settings.botAdmin && !isBotAdmin) {
          return m.reply(mess.botAdmin);
        }
      }

      if (settings.loading) m.reply(mess.wait);
      
      await plugin.run(conn, m, ctx);
      return;
    } catch (e) {
      console.error(`[PLUGIN ERROR] ${plugin.name}:`, e.message);
      return m.reply('Terjadi error saat menjalankan command.');
    }
  }
}

async function handleEval(m, isAsync) {
  let evalCmd;
  
  try {
    const code = m.text.slice(isAsync ? 2 : 1).trim();
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
    const { stdout = '', stderr = '' } = await exec(cmd);
    const output = stdout.trim() || stderr.trim() || 'No output';
    m.reply(output);
  } catch (e) {
    m.reply(util.format(e));
  }
}