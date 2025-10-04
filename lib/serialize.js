import {
  areJidsSameUser,
  delay,
  downloadMediaMessage,
  extractMessageContent,
  jidNormalizedUser,
  getDevice,
  generateMessageIDV2,
  generateWAMessage,
  generateWAMessageFromContent
} from 'baileys';

import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

import Func from '#lib/function.js';

const messId = generateMessageIDV2().slice(0, 4);

export function Client(conn) {
  const client = Object.defineProperties(conn, {
    getJid: {
      value(sender) {
        if (!conn.isLid) conn.isLid = {};
        if (conn.isLid[sender]) return conn.isLid[sender];
        if (!sender.endsWith('@lid')) return sender;

        for (const chat of Object.values(conn.chats)) {
          if (!chat?.participants) continue;
          const user = chat.participants.find(p => p.lid === sender || p.id === sender);
          if (user) {
            return (conn.isLid[sender] = user?.phoneNumber || user?.id);
          }
        }

        return sender;
      }
    },

    insertAllGroup: {
      async value() {
        const groups = (await conn.groupFetchAllParticipating().catch(() => ({}))) || {};
        Object.assign(conn.chats, groups);
        return conn.chats;
      }
    },

    parseMention: {
      value: text => [...text.matchAll(/@(\d{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') || []
    },

    getFile: {
      async value(PATH, saveToFile = false) {
        let filename;
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : PATH instanceof ArrayBuffer
          ? Buffer.from(PATH)
          : /^data:.*?;base64,/i.test(PATH)
          ? Buffer.from(PATH.split(',')[1], 'base64')
          : /^https?:\/\//.test(PATH)
          ? await Func.getBuffer(PATH)
          : fs.existsSync(PATH)
          ? ((filename = PATH), fs.readFileSync(PATH))
          : typeof PATH === 'string'
          ? Buffer.from(PATH)
          : Buffer.alloc(0);

        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');

        const type = (await fileTypeFromBuffer(data)) || { mime: 'application/octet-stream', ext: 'bin' };

        if (saveToFile && !filename) {
          filename = path.join(process.cwd(), `tmp/${Date.now()}.${type.ext}`);
          await fs.promises.writeFile(filename, data);
        }

        return {
          filename,
          ...type,
          data,
          deleteFile: () => filename && fs.promises.unlink(filename)
        };
      },
      enumerable: true
    },

    downloadMediaMessage: {
      async value(message, filename) {
        try {
          const media = await downloadMediaMessage(message, 'buffer', {}, {
            logger: pino({ level: 'fatal' }).child({ class: 'hisoka' }),
            reuploadRequest: conn.updateMediaMessage
          });

          if (filename) {
            const mime = await fileTypeFromBuffer(media);
            const filePath = path.join(process.cwd(), `${filename}.${mime.ext}`);
            await fs.promises.writeFile(filePath, media);
            return filePath;
          }
          return media;
        } catch (err) {
          console.error("Download media error:", err);
          return null;
        }
      },
      enumerable: true
    },

    sendAlbumMessage: {
      async value(jid, medias, options = {}) {
        const userJid = conn.user?.id || conn.authState?.creds?.me?.id;
        if (!Array.isArray(medias) || medias.length < 2) {
          throw new Error('Album minimal berisi 2 media.');
        }

        const time = options.delay || 5000;
        if (options.quoted) options.ephemeralExpiration = options.quoted.expiration || 0;
        delete options.delay;

        const album = await generateWAMessageFromContent(
          jid,
          {
            albumMessage: {
              expectedImageCount: medias.filter(m => m.image).length,
              expectedVideoCount: medias.filter(m => m.video).length,
              ...options
            }
          },
          { userJid, ...options }
        );

        await conn.relayMessage(jid, album.message, { messageId: album.key.id });

        for (const media of medias) {
          let msg;
          if (media.image || media.video) {
            msg = await generateWAMessage(
              jid,
              { ...media, ...options },
              {
                userJid,
                upload: (readStream, opts) => conn.waUploadToServer(readStream, opts),
                ...options
              }
            );
            if (msg) {
              msg.message.messageContextInfo = {
                messageAssociation: {
                  associationType: 1,
                  parentMessageKey: album.key
                }
              };
              await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
              await delay(time);
            }
          }
        }

        return album;
      }
    },

    sendSticker: {
      async value(jid, filePath, m, options = {}) {
        const { data, mime } = await conn.getFile(filePath);
        if (!data.length) throw new TypeError('File tidak ditemukan');

        const exif = {
          packName: options.packname || global.stickpack,
          packPublish: options.packpublish || global.stickauth
        };

        const sticker = await (await import('./exif.js')).writeExif({ mimetype: mime, data }, exif);
        return conn.sendMessage(jid, { sticker }, { quoted: m, ephemeralExpiration: m?.expiration });
      }
    },

    sendGroupV4Invite: {
      async value(groupJid, participant, inviteCode, inviteExpiration, groupName, caption, jpegThumbnail, options = {}) {
        const msg = generateWAMessageFromContent(
          participant,
          {
            groupInviteMessage: {
              inviteCode,
              inviteExpiration: parseInt(inviteExpiration) || Date.now() + 3 * 86400000,
              groupJid,
              groupName,
              jpegThumbnail,
              caption
            }
          },
          { userJid: conn.user.id, ...options }
        );

        await conn.relayMessage(participant, msg.message, { messageId: msg.key.id });
        return msg;
      },
      enumerable: true
    }
  });

  return client;
}

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
    const mention = [
      ...(m.msg?.contextInfo?.mentionedJid || []),
      ...(m.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])
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
    m.prefix = /^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/i.test(m.body) ? m.body[0] : '';
    m.command = m.body?.trim().replace(m.prefix, '').trim().split(/\s+/).shift();
    m.cmd = m.prefix + m.command;
    m.args = m.body.trim().split(/\s+/).slice(1);
    m.text = m.args.join(' ');
    m.expiration = m.msg?.contextInfo?.expiration || 0;

    if (m.isMedia) {
      m.download = () => conn.downloadMediaMessage(m);
    }

    m.isQuoted = !!m.msg?.contextInfo?.quotedMessage;

    if (m.isQuoted) {
      m.quoted = {};
      m.quoted.message = parseMessage(m.msg.contextInfo.quotedMessage);

      if (m.quoted.message) {
        m.quoted.type = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
        m.quoted.msg = parseMessage(m.quoted.message[m.quoted.type]) || m.quoted.message[m.quoted.type];
        m.quoted.isMedia = !!(m.quoted.msg?.mimetype || m.quoted.msg?.thumbnailDirectPath);

        m.quoted.key = {
          remoteJid: m.msg.contextInfo?.remoteJid || m.chat,
          participant: jidNormalizedUser(m.msg.contextInfo?.participant),
          fromMe: areJidsSameUser(
            jidNormalizedUser(m.msg.contextInfo?.participant),
            jidNormalizedUser(conn.user?.id || conn.user?.lid)
          ),
          id: m.msg.contextInfo?.stanzaId
        };

        m.quoted.id = m.quoted.key.id;
        m.quoted.device = getDevice(m.quoted.id);
        m.quoted.chat = /g\.us|status/.test(m.msg.contextInfo?.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
        m.quoted.fromMe = m.quoted.key.fromMe;
        m.quoted.sender = conn.getJid(jidNormalizedUser(m.msg.contextInfo?.participant || m.quoted.chat));

        const mentionQuoted = [
          ...(m.quoted.msg?.contextInfo?.mentionedJid || []),
          ...(m.quoted.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])
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
        m.quoted.args = m.quoted.body.trim().split(/\s+/).slice(1);
        m.quoted.text = m.quoted.args.join(' ');

        if (m.quoted.isMedia) {
          m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
        }
      }
    }
  }

  m.reply = async (text, options = {}) => {
    try {
      await conn.sendPresenceUpdate('available', m.chat)
      await conn.readMessages([m.key])
      await conn.sendPresenceUpdate('composing', m.chat);
      if (typeof text === 'string') {
        return conn.sendMessage(
          m.chat,
          {
            document: {
              url: icon
            },
            mimetype: "application/pdf",
            pageCount: 2025,
            fileName: copyright,
            fileLength: 1024 * 1024 * 1024 * 1024,
            caption: text,
            contextInfo: {
              mentionedJid: [...conn.parseMention(text)],
              forwardingScore: 2025,
              isForwarded: true,
              businessMessageForwardInfo: {
                businessOwnerJid: `62882005514880@s.whatsapp.net`
              },
              forwardedNewsletterMessageInfo: {
                newsletterJid: newsletter,
                newsletterName: title,
                serverMessageId: 1
              },
              externalAdReply: {
                title: title,
                body: body,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: false,
                thumbnailUrl: icon,
                sourceUrl: source
              }
            },
            ...options
          },
          { quoted: m, ephemeralExpiration: m.expiration, ...options }
        );
      } else if (typeof text === 'object') {
        return conn.sendMessage(m.chat, { ...text, ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options });
      }
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      await conn.sendPresenceUpdate('unavailable', m.chat);
    }
  };

  return m;
}

function parseMessage(content) {
  content = extractMessageContent(content);

  if (content?.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;
  if (content?.protocolMessage?.type === 14) content = content.protocolMessage[getContentType(content.protocolMessage)];
  if (content?.message) content = content.message[getContentType(content.message)];

  return content;
}

const getContentType = content =>
  content ? Object.keys(content).find(k => (k === 'conversation' || k.endsWith('Message') || /V[23]/.test(k)) && k !== 'senderKeyDistributionMessage') : undefined;