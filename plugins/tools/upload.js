import axios from "axios";
import FormData from "form-data";

export default {
  name: "upload",
  category: "tools",
  command: ["upload"],
  run: async (conn, m) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || "";
    if (!mime) return m.reply("Reply ke media yang ingin diupload.");
    const buffer = await q.download();
    const form = new FormData();
    form.append("file", buffer, "upload.bin");

    const { data } = await axios.post("https://file.io", form, { headers: form.getHeaders() });
    if (!data.success) return m.reply("Gagal upload file.");
    m.reply(`📤 *File berhasil diupload!*\n\n🔗 ${data.link}`);
  }
}