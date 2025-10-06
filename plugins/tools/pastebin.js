import axios from "axios";

export default {
  name: "bin",
  category: "tools",
  command: ["bin", "paste"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan teks yang ingin disimpan ke bin.");
    try {
      const { data } = await axios.post("https://pastebin.run/api/v1/paste", { content: text });
      m.reply(`📄 *Teks disimpan di:*\n${data.url}`);
    } catch {
      m.reply("Gagal menyimpan ke bin.");
    }
  }
}