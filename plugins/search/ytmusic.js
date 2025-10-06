import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "ytmusic",
  category: "search",
  command: ["ytmusic", "musicsearch"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan judul lagu.\nContoh: *.ytmusic until i found you*");
    try {
      const { data } = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}+lyrics`);
      const $ = cheerio.load(data);
      const results = [];
      $("a#video-title").each((_, el) => {
        const title = $(el).text().trim();
        const url = "https://www.youtube.com" + $(el).attr("href");
        if (title && url.includes("watch")) results.push({ title, url });
      });
      if (!results.length) return m.reply("Lagu tidak ditemukan.");
      const list = results.slice(0, 5).map((v, i) => `${i + 1}. *${v.title}*\n${v.url}`).join("\n\n");
      m.reply(`🎧 *Hasil pencarian lagu untuk:* ${text}\n\n${list}`);
    } catch {
      m.reply("Gagal mencari lagu di YouTube Music.");
    }
  }
}