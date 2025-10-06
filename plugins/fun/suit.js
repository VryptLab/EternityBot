export default {
    name: "suit",
    category: "game",
    command: ["suit"],
    run: async (conn, m) => {
        const user = m.text?.toLowerCase();
        if (!["batu", "gunting", "kertas"].includes(user))
            return m.reply("Pilih salah satu: batu / gunting / kertas");
        const bot = ["batu", "gunting", "kertas"][Math.floor(Math.random() * 3)];
        const result =
            user === bot ? "Seri 🤝" :
            (user === "batu" && bot === "gunting") ||
            (user === "gunting" && bot === "kertas") ||
            (user === "kertas" && bot === "batu")
                ? "Kamu menang 🏆"
                : "Kamu kalah 💀";
        m.reply(`Kamu: *${user}*\nBot: *${bot}*\n\n${result}`);
    }
}