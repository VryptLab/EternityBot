import {
  areJidsSameUser,
  jidNormalizedUser,
  getDevice
} from 'baileys';

import { messId, PREFIX_REGEX } from './constants.js';
import { getContentType, parseMessage } from './helpers.js';

export default async function serialize(conn, msg) {
  if (!msg) return;

  const m = {};
  m.message = parseMessage(msg.message);

  if (msg.key) {
    m.key = msg.key;
    m.id = m.key.id;
    m.device = getDevice(m.id);
    m.isBot = m.id.startsWith(messId);
    m.chat = conn.getJid(jidNormalizedUser(m.key.remoteJid));
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = conn.getJid(jidNormalizedUser(msg.key.participantAlt || msg.key.participantPn || msg.key.participant || m.chat));
    m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, jidNormalizedUser(conn.user?.id));
  }

  m.pushname = msg.pushName;
  m.timestamp = msg.messageTimestamp;

  if (m.message) {
    m.type = getContentType(m.message);
    m.msg = parseMessage(m.message[m.type]) || m.message[m.type];
    m.isMedia = !!(m.msg?.mimetype || m.msg?.thumbnailDirectPath);

    const ctxInfo = m.msg?.contextInfo;
    const mention = [
      ...(ctxInfo?.mentionedJid || []),
      ...(ctxInfo?.groupMentions?.map(v => v.groupJid) || [])
    ];
    m.mentions = mention.map(jid => conn.getJid(jid));

    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      '';

    const firstChar = m.body[0];
    m.prefix = PREFIX_REGEX.test(firstChar) ? firstChar : '';
    const trimmed = m.body.trim();
    const parts = trimmed.replace(m.prefix, '').trim().split(/\s+/);
    m.command = parts[0];
    m.cmd = m.prefix + m.command;
    m.args = parts.slice(1);
    m.text = m.args.join(' ');
    m.expiration = ctxInfo?.expiration || 0;

    if (m.isMedia) {
      m.download = () => conn.downloadMediaMessage(m);
    }

    m.isQuoted = !!ctxInfo?.quotedMessage;

    if (m.isQuoted) {
      m.quoted = {};
      m.quoted.message = parseMessage(ctxInfo.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg = parseMessage(m.quoted.message[m.quoted.type]) || m.quoted.message[m.quoted.type];
        m.quoted.isMedia = !!(m.quoted.msg?.mimetype || m.quoted.msg?.thumbnailDirectPath);

        const participant = jidNormalizedUser(ctxInfo.participant);
        m.quoted.key = {
          remoteJid: ctxInfo.remoteJid || m.chat,
          participant,
          fromMe: areJidsSameUser(participant, jidNormalizedUser(conn.user?.id || conn.user?.lid)),
          id: ctxInfo.stanzaId
        };

        m.quoted.id = m.quoted.key.id;
        m.quoted.device = getDevice(m.quoted.id);
        m.quoted.chat = /g\.us|status/.test(ctxInfo.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.sender = conn.getJid(participant || m.quoted.chat);

        const qCtxInfo = m.quoted.msg?.contextInfo;
        const mentionQuoted = [
          ...(qCtxInfo?.mentionedJid || []),
          ...(qCtxInfo?.groupMentions?.map(v => v.groupJid) || [])
        ];
        m.quoted.mentions = mentionQuoted.map(jid => conn.getJid(jid));

        m.quoted.body =
          m.quoted.msg?.text ||
          m.quoted.msg?.caption ||
          m.quoted.message?.conversation ||
          m.quoted.msg?.selectedButtonId ||
          m.quoted.msg?.singleSelectReply?.selectedRowId ||
          m.quoted.msg?.selectedId ||
          m.quoted.msg?.contentText ||
          m.quoted.msg?.selectedDisplayText ||
          m.quoted.msg?.title ||
          m.quoted.msg?.name ||
          '';

        const qParts = m.quoted.body.trim().split(/\s+/);
        m.quoted.args = qParts.slice(1);
        m.quoted.text = m.quoted.args.join(' ');

        if (m.quoted.isMedia) {
          m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
        }
      }
    }
  }

  const { createReply } = await import('./reply.js');
  m.reply = createReply(conn, m);

  return m;
}