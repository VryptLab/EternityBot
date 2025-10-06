import axios from "axios";

export default {
  name: "movie",
  category: "search",
  command: ["movie", "film"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan judul film.\nContoh: *.movie Inception*");
    try {
      const { data } = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=thewdb`);
      if (data.Response === "False") return m.reply("Film tidak ditemukan.");
      await conn.sendMessage(m.chat, {
        image: { url: data.Poster },
        caption: `🎬 *${data.Title} (${data.Year})*\n⭐ ${data.imdbRating}\n🕒 ${data.Runtime}\n🎭 Genre: ${data.Genre}\n🎥 Sutradara: ${data.Director}\n\n📖 ${data.Plot}`
      }, { quoted: m });
    } catch {
      m.reply("Gagal mencari film.");
    }
  }
}