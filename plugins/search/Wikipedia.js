import axios from "axios";

export default {
  name: "wikipedia",
  category: "search",
  command: ["wiki", "wikipedia"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan kata kunci.\nContoh: *.wiki Fisika Kuantum*");
    try {
      const { data } = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
      if (data.title && data.extract) {
        await conn.sendMessage(m.chat, {
          image: data.thumbnail ? { url: data.thumbnail.source } : undefined,
          caption: `📖 *${data.title}*\n\n${data.extract}\n\n🔗 ${data.content_urls.desktop.page}`
        }, { quoted: m });
      } else {
        m.reply("Tidak ditemukan hasil di Wikipedia.");
      }
    } catch {
      m.reply("Tidak ada hasil yang cocok di Wikipedia.");
    }
  }
}