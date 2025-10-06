import axios from "axios";

export default {
  name: "npmsearch",
  category: "search",
  command: ["npm", "npmsearch"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan nama package.\nContoh: *.npm axios*");
    try {
      const { data } = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=5`);
      if (!data.objects.length) return m.reply("Package tidak ditemukan.");
      const list = data.objects
        .map((p, i) => `${i + 1}. *${p.package.name}* — ${p.package.version}\n${p.package.description || "-"}\n🔗 ${p.package.links.npm}`)
        .join("\n\n");
      m.reply(`📦 *Hasil pencarian NPM untuk:* ${text}\n\n${list}`);
    } catch {
      m.reply("Gagal mencari package NPM.");
    }
  }
}