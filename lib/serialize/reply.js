export function createReply(conn, m) {
  return async (text, options = {}) => {
    try {
      await conn.sendPresenceUpdate('available', m.chat);
      await conn.readMessages([m.key]);
      await conn.sendPresenceUpdate('composing', m.chat);

      if (typeof text === 'string') {
        return conn.sendMessage(
          m.chat,
          {
            document: { url: icon },
            mimetype: 'application/pdf',
            pageCount: 2025,
            fileName: copyright,
            fileLength: 1099511627776,
            caption: text,
            contextInfo: {
              mentionedJid: conn.parseMention(text),
              forwardingScore: 2025,
              isForwarded: true,
              businessMessageForwardInfo: {
                businessOwnerJid: '62882005514880@s.whatsapp.net'
              },
              forwardedNewsletterMessageInfo: {
                newsletterJid: newsletter,
                newsletterName: title,
                serverMessageId: 1
              },
              externalAdReply: {
                title,
                body,
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
      }

      return conn.sendMessage(m.chat, { ...text, ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options });
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      await conn.sendPresenceUpdate('unavailable', m.chat);
    }
  };
}