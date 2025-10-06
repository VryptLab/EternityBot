import fs from "fs";
import { writeExifImg, writeExifVid } from "#lib/exif.js";

export default {
  name: "tosticker",
  category: "converter",
  command: ["stiker", "sticker"],
  run: async (conn, m) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || "";
    if (!/image|video/.test(mime)) return m.reply("Reply gambar atau video yang ingin dijadikan stiker.");
    const buffer = await q.download();
    const isVideo = mime.includes("video");
    const sticker = isVideo ? await writeExifVid(buffer, { packname: "EternityBot", author: "VryptLab" }) : await writeExifImg(buffer, { packname: "EternityBot", author: "VryptLab" });
    await conn.sendMessage(m.chat, { sticker }, { quoted: m });
  }
}