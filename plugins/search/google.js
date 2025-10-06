import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "google",
  category: "search",
  command: ["google", "gsearch"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan query.\nContoh: *.google Node.js tutorial*");
    try {
      const { data } = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(text)}&hl=id`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const $ = cheerio.load(data);
      const results = [];
      $("div.tF2Cxc").each((_, el) => {
        const title = $(el).find("h3").text();
        const link = $(el).find("a").attr("href");
        if (title && link) results.push({ title, link });
      });

      if (!results.length) return m.reply("Tidak ditemukan hasil yang relevan.");
      const list = results.slice(0, 5).map((r, i) => `${i + 1}. *${r.title}*\n${r.link}`).join("\n\n");
      m.reply(`🔍 *Hasil Google untuk:* ${text}\n\n${list}`);
    } catch (e) {
      console.error(e);
      m.reply("Gagal mengambil hasil pencarian Google.");
    }
  }
}