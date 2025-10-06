import axios from "axios";

export default {
    name: "translate",
    category: "utils",
    command: ["translate", "tr"],
    settings: {},
    run: async (conn, m, { text }) => {
        const [lang, ...words] = text.split(" ");
        if (!lang || !words.length) return m.reply("Format salah.\nContoh: *.tr en aku suka kamu*");
        try {
            const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(words.join(" "))}&langpair=auto|${lang}`);
            const result = res.data.responseData.translatedText;
            await m.reply(`🌐 *Terjemahan (${lang}):*\n${result}`);
        } catch {
            m.reply("Gagal menerjemahkan teks.");
        }
    }
}