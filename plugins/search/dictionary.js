import axios from "axios";

export default {
  name: "dictionary",
  category: "search",
  command: ["define", "dict"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan kata.\nContoh: *.define philosophy*");
    try {
      const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`);
      const def = data[0].meanings[0].definitions[0];
      m.reply(`📘 *${data[0].word}* (${data[0].phonetic || "-"})  
\n📖 ${def.definition}  
💬 Contoh: ${def.example || "—"}`);
    } catch {
      m.reply("Kata tidak ditemukan di kamus.");
    }
  }
}