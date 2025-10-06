export default {
    name: "bcgc",
    category: "owner",
    command: ["bcgc", "broadcastgc"],
    settings: { owner: true },
    run: async (conn, m) => {
        if (!m.text) return m.reply("Contoh: .bcgc Pesan penting dari owner.");
        const groups = Object.keys(conn.chats).filter(v => v.endsWith("@g.us"));
        for (const id of groups) {
            await conn.sendMessage(id, { text: `📢 *Broadcast:*\n${m.text}` });
            await new Promise(r => setTimeout(r, 1500));
        }
        m.reply(`✅ Broadcast terkirim ke ${groups.length} grup.`);
    }
}