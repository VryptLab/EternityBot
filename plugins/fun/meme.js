import axios from "axios";

export default {
    name: "meme",
    category: "fun",
    command: ["meme", "randommeme"],
    settings: {},
    run: async (conn, m) => {
        try {
            const res = await axios.get("https://meme-api.com/gimme");
            const meme = res.data;
            await conn.sendMessage(m.chat, {
                image: { url: meme.url },
                caption: `🤣 *${meme.title}*\n👤 ${meme.author}\n🔗 ${meme.postLink}`
            }, { quoted: m });
        } catch {
            m.reply("Gagal mengambil meme 😅");
        }
    }
}