import axios from "axios";

export default {
    name: "quote",
    category: "fun",
    command: ["quote", "quotes"],
    settings: {},
    run: async (conn, m) => {
        try {
            const res = await axios.get("https://api.quotable.io/random");
            const q = res.data;
            await m.reply(`💭 *"${q.content}"*\n– ${q.author}`);
        } catch {
            m.reply("Gagal mengambil kutipan.");
        }
    }
}