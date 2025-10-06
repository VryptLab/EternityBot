export default {
    name: "ssweb",
    category: "developer",
    command: ["ssweb", "screenshot"],
    run: async (conn, m) => {
        const url = m.text.trim();
        if (!/^https?:\/\//i.test(url)) return m.reply("📷 Contoh: .ssweb https://example.com");

        const api = `https://image.thum.io/get/fullpage/${encodeURIComponent(url)}`;
        await conn.sendMessage(m.chat, { image: { url: api }, caption: `🖼️ Screenshot dari ${url}` });
    }
}