export default {
    name: "tebakangka",
    category: "game",
    command: ["tebakangka"],
    run: async (conn, m) => {
        const target = Math.floor(Math.random() * 10) + 1;
        await m.reply("Aku sudah pilih angka antara 1–10. Coba tebak!");
        const collector = msg => msg.sender === m.sender && /^\d+$/.test(msg.text);
        const listener = conn.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!collector(msg)) return;
            const guess = parseInt(msg.text);
            conn.ev.off("messages.upsert", listener);
            if (guess === target) return m.reply(`🎯 Betul! Angkanya *${target}*`);
            m.reply(`❌ Salah, yang benar *${target}*`);
        });
    }
}