import axios from "axios";

export default {
  name: "redirect",
  category: "internet",
  command: ["redirect", "trace"],
  settings: {},
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan URL. Contoh: *.redirect bit.ly/xyz*");
    try {
      const res = await axios.get(text, { maxRedirects: 10 });
      m.reply(`🔗 Redirect berakhir di:\n${res.request.res.responseUrl}`);
    } catch {
      m.reply("Gagal mengikuti redirect URL.");
    }
  }
}