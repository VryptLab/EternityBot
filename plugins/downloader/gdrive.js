import gdrive from "#scrape/gdrive.js";
import axios from "axios";

export default {
  name: "gdrive downloader",
  category: "downloader",
  command: ["gdrive", "drive"],
  run: async (conn, m) => {
    try {
      const input = m.isQuoted ? m.quoted.text : m.text;
      const regex = /(https?:\/\/(?:drive\.google\.com)\/file\/d\/[a-zA-Z0-9_-]+)/;
      const parseUrl = input.match(regex)?.[0];

      if (!parseUrl) {
        return m.reply(
          `# Cara Penggunaan\n\n` +
            `> Masukkan URL Google Drive untuk mengunduh konten\n\n` +
            `# Contoh Penggunaan\n` +
            `> *${m.cmd} https://drive.google.com/file/d/...*`
        );
      }

      const res = await gdrive(parseUrl);

      const fileBuffer = await axios
        .get(res.download, { responseType: "arraybuffer" })
        .then((v) => v.data);

      const caption = `📂 *${res.name}*\n` +
        `🗂️ Type: ${res.mimeType}\n` +
        `📦 Size: ${res.sizeMB}\n` +
        `🔗 Link: ${res.link}`;

      await conn.sendMessage(m.chat, {
        document: fileBuffer,
        fileName: res.name,
        mimetype: res.mimeType,
        caption,
      }, { quoted: m });
    } catch (e) {
      console.error(e);
      m.reply(mess.gagal || "Gagal mengunduh file dari Google Drive.");
    }
  },
};