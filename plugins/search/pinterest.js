import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "pinterest",
  category: "search",
  command: ["pinterest", "pin"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan kata kunci gambar.\nContoh: *.pinterest anime aesthetic*");
    try {
      const { data } = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(text)}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const $ = cheerio.load(data);
      const images = [];
      $("img[srcset]").each((_, el) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("https")) images.push(src);
      });

      if (!images.length) return m.reply("Gambar tidak ditemukan di Pinterest.");
      const randomImg = images[Math.floor(Math.random() * images.length)];
      await conn.sendMessage(m.chat, { image: { url: randomImg }, caption: `🔎 Pinterest hasil untuk *${text}*` }, { quoted: m });
    } catch {
      m.reply("Gagal mengambil hasil dari Pinterest.");
    }
  }
}