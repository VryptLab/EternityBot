import axios from "axios";

export default {
  name: "latency",
  category: "internet",
  command: ["latency", "pingurl"],
  settings: {},
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan URL API.\nContoh: *.latency https://api.github.com*");
    const start = Date.now();
    try {
      await axios.get(text);
      const ms = Date.now() - start;
      await m.reply(`⚡ Respon dari ${text} dalam *${ms}ms*`);
    } catch {
      m.reply("URL tidak dapat diakses.");
    }
  }
}