import axios from "axios";

export default {
    name: "joke",
    category: "fun",
    command: ["joke", "lelucon"],
    settings: {},
    run: async (conn, m) => {
        try {
            const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
            await m.reply(`🤣 *${res.data.setup}*\n${res.data.punchline}`);
        } catch {
            m.reply("Gagal mengambil lelucon, coba lagi nanti.");
        }
    }
}