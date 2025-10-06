import axios from "axios";
import * as cheerio from "cheerio";

export default {
    name: "urlinfo",
    category: "internet",
    command: ["urlinfo", "meta"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Kirim URL.\nContoh: *.urlinfo https://vrypt.my.id*");
        try {
            const res = await axios.get(text);
            const $ = cheerio.load(res.data);
            const title = $("title").text() || "-";
            const desc = $('meta[name="description"]').attr("content") || "-";
            await m.reply(`🌐 *${title}*\n📄 ${desc}`);
        } catch {
            m.reply("Gagal memuat metadata situs.");
        }
    }
}