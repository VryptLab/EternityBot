export default {
    name: "http",
    category: "developer",
    command: ["http", "status"],
    run: async (conn, m) => {
        const code = parseInt(m.text.trim());
        if (isNaN(code)) return m.reply("🧩 Contoh: .http 404");

        const res = await fetch(`https://http.cat/${code}.jpg`);
        if (res.status === 404) return m.reply("❌ Kode tidak valid.");

        await conn.sendMessage(m.chat, {
            image: { url: `https://http.cat/${code}.jpg` },
            caption: `🔢 *HTTP ${code}*`
        });
    }
}