import fs from "fs";

export default {
  name: "tofile",
  category: "converter",
  command: ["tofile"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan teks untuk dijadikan file.");
    const path = `./tmp/text-${Date.now()}.txt`;
    fs.writeFileSync(path, text);
    await conn.sendMessage(m.chat, { document: { url: path }, mimetype: "text/plain", fileName: "text.txt" }, { quoted: m });
    fs.unlinkSync(path);
  }
}