import fs from "fs";

export default {
  name: "getfile",
  category: "owner",
  command: ["getfile"],
  settings: { owner: true },
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan nama file. Contoh: *.getfile plugins/group/lockgroup.js*");
    if (!fs.existsSync(text)) return m.reply("File tidak ditemukan.");
    await conn.sendMessage(m.chat, { document: fs.readFileSync(text), fileName: text, mimetype: "text/plain" }, { quoted: m });
  }
}