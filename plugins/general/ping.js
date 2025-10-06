export default {
    name: "ping",
    category: "general",
    command: ["ping", "test"],
    run: async (conn, m) => {
        const start = Date.now();
        const msg = await m.reply("Testing ping...");
        const speed = Date.now() - start;
        conn.sendMessage(m.chat, { edit: msg.key, text: `Pong! ⚡ ${speed}ms` });
    }
}