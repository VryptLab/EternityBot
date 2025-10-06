export default {
    name: "cleanup",
    category: "utility",
    command: ["cleanup"],
    settings: {
        owner: true
    },
    run: async (conn, m, { Func }) => {
        const msgs = await conn.loadMessages(m.chat, 50);
        const botMsgs = msgs.filter(v => v.key.fromMe);
        for (const msg of botMsgs) {
            await conn.sendMessage(m.chat, { delete: msg.key });
            await Func.delay(300);
        }
        m.reply(`Berhasil hapus ${botMsgs.length} pesan milik bot.`);
    }
}