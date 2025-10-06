export default {
    name: "tebakkata",
    category: "game",
    command: ["tebakkata"],
    run: async (conn, m) => {
        const words = ["vrypt", "bot", "whatsapp", "nodejs", "plugin"];
        const pick = words[Math.floor(Math.random() * words.length)];
        const scrambled = pick.split("").sort(() => Math.random() - 0.5).join("");
        await m.reply(`Susun kata ini: *${scrambled.toUpperCase()}*`);
        const listener = conn.ev.on("messages.upsert", ({ messages }) => {
            const msg = messages[0];
            if (msg.sender !== m.sender) return;
            conn.ev.off("messages.upsert", listener);
            if (msg.text.toLowerCase() === pick) {
                m.reply("✅ Benar!");
            } else {
                m.reply(`❌ Salah, jawabannya: *${pick}*`);
            }
        });
    }
}