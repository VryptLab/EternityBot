import {
  delay,
  downloadMediaMessage,
  generateWAMessage,
  generateWAMessageFromContent
} from 'baileys';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import path from 'path';

import Func from '#lib/function.js';
import { logger, BASE64_REGEX, URL_REGEX } from './constants.js';
import { parseMention } from './helpers.js';

export function Client(conn) {
  const client = Object.defineProperties(conn, {
    getJid: {
      value(sender) {
        if (!conn.isLid) conn.isLid = {};
        if (conn.isLid[sender]) return conn.isLid[sender];
        if (!sender.endsWith('@lid')) return sender;

        const chats = Object.values(conn.chats);
        for (let i = 0; i < chats.length; i++) {
          const participants = chats[i]?.participants;
          if (!participants) continue;
          
          for (let j = 0; j < participants.length; j++) {
            const p = participants[j];
            if (p.lid === sender || p.id === sender) {
              return (conn.isLid[sender] = p.phoneNumber || p.id);
            }
          }
        }

        return sender;
      }
    },

    insertAllGroup: {
      async value() {
        const groups = await conn.groupFetchAllParticipating().catch(() => ({}));
        if (groups) Object.assign(conn.chats, groups);
        return conn.chats;
      }
    },

    parseMention: {
      value: parseMention
    },

    getFile: {
      async value(PATH, saveToFile = false) {
        let filename;
        let data;

        if (Buffer.isBuffer(PATH)) {
          data = PATH;
        } else if (PATH instanceof ArrayBuffer) {
          data = Buffer.from(PATH);
        } else if (BASE64_REGEX.test(PATH)) {
          data = Buffer.from(PATH.split(',')[1], 'base64');
        } else if (URL_REGEX.test(PATH)) {
          data = await Func.getBuffer(PATH);
        } else if (fs.existsSync(PATH)) {
          filename = PATH;
          data = fs.readFileSync(PATH);
        } else if (typeof PATH === 'string') {
          data = Buffer.from(PATH);
        } else {
          data = Buffer.alloc(0);
        }

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
          const media = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
              logger,
              reuploadRequest: conn.updateMediaMessage
            }
          );

          if (filename) {
            const mime = await fileTypeFromBuffer(media);
            const filePath = path.join(process.cwd(), `${filename}.${mime.ext}`);
            await fs.promises.writeFile(filePath, media);
            return filePath;
          }
          return media;
        } catch (err) {
          console.error('Download media error:', err);
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

        const imageCount = medias.filter(m => m.image).length;
        const videoCount = medias.filter(m => m.video).length;

        const album = await generateWAMessageFromContent(
          jid,
          {
            albumMessage: {
              expectedImageCount: imageCount,
              expectedVideoCount: videoCount,
              ...options
            }
          },
          { userJid, ...options }
        );

        await conn.relayMessage(jid, album.message, { messageId: album.key.id });

        const uploadFn = (readStream, opts) => conn.waUploadToServer(readStream, opts);

        for (let i = 0; i < medias.length; i++) {
          const media = medias[i];
          if (!media.image && !media.video) continue;

          const msg = await generateWAMessage(
            jid,
            { ...media, ...options },
            { userJid, upload: uploadFn, ...options }
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

        const { writeExif } = await import('./exif.js');
        const sticker = await writeExif({ mimetype: mime, data }, exif);
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
              inviteExpiration: parseInt(inviteExpiration) || Date.now() + 259200000,
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