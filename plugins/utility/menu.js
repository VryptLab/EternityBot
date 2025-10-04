export default {
  name: "menu",
  category: "utility",
  command: ["menu"],
  run: async (conn, m, { Func }) => {
    let grouped = {}
    for (let plugin of Object.values(plugins)) {
      if (!grouped[plugin.category]) grouped[plugin.category] = []
      grouped[plugin.category].push(plugin)
    }
    
    let fkontak = {
    "key": {
      "participants": "0@s.whatsapp.net",
      "remoteJid": "status@broadcast",
      "fromMe": false,
      "id": "Powered by VryptLabs"
    },
    "message": {
      "contactMessage": {
        "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    "participant": "0@s.whatsapp.net"
    };

    let time = new Date().toLocaleString("id-ID", {
        timeZone: 'Asia/Jakarta',
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
        })

    let header = `
I am an automated system
(WhatsApp Bot) that can help
to do something, search and
get data / information only
through WhatsApp.

◦ *Status:* Online
◦ *Runtime:* ${Func.runtime(process.uptime())}
◦ *Time:* ${time}
◦ *Source:* ${source}
`

    let body = Object.entries(grouped).map(([category, items]) => {
      return (
        `\n┏─[  ${category.toUpperCase()} ]\n` +
        items.map(p => `│▢ ${m.prefix}${p.name}`).join("\n")
      )
    }).join("\n┗─────────❍\n")

    let footer = `\n━━━━━━━━━━━━━━━━━━━━━━\nTotal Kategori: ${Object.keys(grouped).length} | Total Fitur: ${Object.values(grouped).flat().length}`

    let menu = header + body + footer
    conn.sendMessage(m.chat, {
      document: {
        url: icon
      },
      mimetype: "application/pdf",
      pageCount: 2025,
      fileName: copyright,
      fileLength: 1024 * 1024 * 1024 * 1024,
      caption: menu,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        businessMessageForwardInfo: {
          businessOwnerJid: `62882005514880@s.whatsapp.net`
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
          previewType: "PHOTO",
          renderLargerThumbnail: true,
          thumbnailUrl: thumbnail,
          sourceUrl: source
        }
      }
    }, { quoted: fkontak })
  }
}