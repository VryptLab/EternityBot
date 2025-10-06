import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "apksearch",
  category: "search",
  command: ["apk", "apksearch"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan nama aplikasi.\nContoh: *.apk Telegram*");
    try {
      const { data } = await axios.get(`https://apkpure.com/id/search?q=${encodeURIComponent(text)}`);
      const $ = cheerio.load(data);
      const results = [];
      $(".main .search-dl .search-title a").each((_, el) => {
        const title = $(el).text();
        const link = "https://apkpure.com" + $(el).attr("href");
        if (title) results.push({ title, link });
      });
      if (!results.length) return m.reply("Aplikasi tidak ditemukan.");
      const list = results.slice(0, 5).map((v, i) => `${i + 1}. *${v.title}*\n${v.link}`).join("\n\n");
      m.reply(`📱 *Hasil pencarian aplikasi: ${text}*\n\n${list}`);
    } catch {
      m.reply("Gagal mencari aplikasi.");
    }
  }
}