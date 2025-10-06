import axios from "axios";

export default {
  name: "film",
  category: "search",
  command: ["film", "movie"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan judul film.\nContoh: *.film Interstellar*");
    try {
      const key = "thewdb"; // Key publik gratis
      const { data } = await axios.get(`https://www.omdbapi.com/?apikey=${key}&t=${encodeURIComponent(text)}`);
      if (data.Response === "False") return m.reply("Film tidak ditemukan.");
      await conn.sendMessage(m.chat, {
        image: { url: data.Poster },
        caption: `🎬 *${data.Title} (${data.Year})*  
⭐ ${data.imdbRating}/10  
🎭 ${data.Genre}  
📅 ${data.Released}  
📖 ${data.Plot}`
      }, { quoted: m });
    } catch {
      m.reply("Gagal mencari film.");
    }
  }
}