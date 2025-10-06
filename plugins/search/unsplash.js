import axios from "axios";

export default {
  name: "unsplash",
  category: "search",
  command: ["unsplash", "photo"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan kata kunci gambar.\nContoh: *.unsplash sunset beach*");
    try {
      const { data } = await axios.get(`https://source.unsplash.com/1600x900/?${encodeURIComponent(text)}`);
      await conn.sendMessage(m.chat, { image: { url: data.request.res.responseUrl }, caption: `📸 Gambar dari Unsplash\nQuery: *${text}*` }, { quoted: m });
    } catch {
      m.reply("Gagal mengambil gambar dari Unsplash.");
    }
  }
}