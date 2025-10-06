export default {
    name: "ship",
    category: "fun",
    command: ["ship", "cocok"],
    settings: {},
    run: async (conn, m, { text }) => {
        const [a, b] = text.split("|").map(v => v.trim());
        if (!a || !b) return m.reply("Format salah.\nContoh: *.ship Ki | EternityBot*");
        const love = Math.floor(Math.random() * 100);
        const emoji = love > 75 ? "💞" : love > 50 ? "❤️" : love > 25 ? "💔" : "❌";
        await m.reply(`${emoji} *${a}* ❤️ *${b}*\nTingkat kecocokan: *${love}%*`);
    }
}