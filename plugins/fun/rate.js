export default {
    name: "rate",
    category: "fun",
    command: ["rate"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Contoh: *.rate bot ini keren ga?*");
        const rate = Math.floor(Math.random() * 100) + 1;
        await m.reply(`🔮 Aku menilai *${text.trim()}* sebesar *${rate}%*!`);
    }
}