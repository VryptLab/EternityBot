const TIME_OPTIONS = {
  timeZone: 'Asia/Jakarta',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
};

const HEADER_TEMPLATE = `
I am an automated system
(WhatsApp Bot) that can help
to do something, search and
get data / information only
through WhatsApp.

◦ *Status:* Online
◦ *Runtime:* {{runtime}}
◦ *Time:* {{time}}
◦ *Source:* {{source}}
`;

const FILE_LENGTH = 1099511627776;

let pluginsCache = null;
let pluginsCacheTime = 0;
const CACHE_DURATION = 60000;

function getGroupedPlugins() {
  const now = Date.now();

  if (pluginsCache && (now - pluginsCacheTime) < CACHE_DURATION) {
    return pluginsCache;
  }

  const grouped = {};
  const pluginValues = Object.values(plugins);
  
  for (let i = 0; i < pluginValues.length; i++) {
    const plugin = pluginValues[i];
    const category = plugin.category;
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(plugin);
  }

  pluginsCache = grouped;
  pluginsCacheTime = now;
  
  return grouped;
}

function createFakeContact(sender) {
  const number = sender.split('@')[0];
  
  return {
    key: {
      participants: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast',
      fromMe: false,
      id: 'Powered by VryptLabs'
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${number}:${number}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  };
}

function buildMenuBody(grouped, prefix) {
  const categories = Object.entries(grouped);
  const parts = new Array(categories.length);
  
  for (let i = 0; i < categories.length; i++) {
    const [category, items] = categories[i];
    const commands = new Array(items.length);
    
    for (let j = 0; j < items.length; j++) {
      commands[j] = `├ ◈ ${prefix}${items[j].name}`;
    }
    
    parts[i] = `\n╭─「 ${category.toUpperCase()} 」\n${commands.join('\n')}`;
  }
  
  return parts.join('\n╰────────────\n');
}

export default {
  name: 'menu',
  category: 'utility',
  command: ['menu'],
  run: async (conn, m, { Func }) => {
    const grouped = getGroupedPlugins();
    const fkontak = createFakeContact(m.sender);
    
    const time = new Date().toLocaleString('id-ID', TIME_OPTIONS);
    
    const header = HEADER_TEMPLATE
      .replace('{{runtime}}', Func.runtime(process.uptime()))
      .replace('{{time}}', time)
      .replace('{{source}}', source);
    
    const body = buildMenuBody(grouped, m.prefix);
    
    const totalCategories = Object.keys(grouped).length;
    let totalFeatures = 0;
    
    const categoryValues = Object.values(grouped);
    for (let i = 0; i < categoryValues.length; i++) {
      totalFeatures += categoryValues[i].length;
    }
    
    const footer = `\n━━━━━━━━━━━━━━━━━━━━━━\nTotal Kategori: ${totalCategories} | Total Fitur: ${totalFeatures}`;
    
    const menu = header + body + footer;
    
    await conn.sendMessage(
      m.chat,
      {
        document: { url: icon },
        mimetype: 'application/pdf',
        pageCount: 2025,
        fileName: copyright,
        fileLength: FILE_LENGTH,
        caption: menu,
        contextInfo: {
          mentionedJid: [m.sender],
          isForwarded: true,
          businessMessageForwardInfo: {
            businessOwnerJid: '62882005514880@s.whatsapp.net'
          },
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletter,
            newsletterName: title,
            serverMessageId: 1
          },
          forwardingScore: 2025,
          externalAdReply: {
            title,
            body,
            mediaType: 1,
            previewType: 'PHOTO',
            renderLargerThumbnail: true,
            thumbnailUrl: thumbnail,
            sourceUrl: source
          }
        }
      },
      { quoted: fkontak }
    );
  }
};