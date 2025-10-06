import axios from "axios";

export default {
    name: "lyrics",
    category: "fun",
    command: ["lyrics", "lirik"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Tulis judul lagu.\nContoh: *.lyrics perfect ed sheeran*");
        try {
            const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(text)}`);
            const { title, author, lyrics } = res.data;
            const caption = `🎶 *${title}* - ${author}\n\n${lyrics.slice(0, 2000)}${lyrics.length > 2000 ? "..." : ""}`;
            await m.reply(caption);
        } catch {
            m.reply("Lirik tidak ditemukan 😔");
        }
    }
}