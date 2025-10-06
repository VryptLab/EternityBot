export default {
    name: "8ball",
    category: "fun",
    command: ["8ball", "magic"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Tanyakan sesuatu.\nContoh: *.8ball Apakah bot ini pintar?*");
        const answers = [
            "Tentu saja!",
            "Sepertinya iya.",
            "Kurasa tidak.",
            "Jangan berharap terlalu banyak.",
            "Mungkin.",
            "Jawabannya ada di hatimu ❤️"
        ];
        const result = answers[Math.floor(Math.random() * answers.length)];
        await m.reply(`🎱 ${result}`);
    }
}