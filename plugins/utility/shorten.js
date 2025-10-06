import axios from "axios";

export default {
    name: "shorten",
    category: "utility",
    command: ["short", "shorten", "tiny"],
    settings: {
        group: false,
        admin: false,
        botAdmin: false
    },
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Kirim URL yang ingin dipendekkan.\n\nContoh: *.short https://github.com/VryptLab/EternityBot*");
        if (!/^https?:\/\//i.test(text)) return m.reply("URL tidak valid, pastikan dimulai dengan http:// atau https://");

        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
            await m.reply(`🔗 *URL Dipendekkan:*\n${res.data}`);
        } catch {
            m.reply("Gagal memendekkan URL, coba lagi nanti.");
        }
    }
}