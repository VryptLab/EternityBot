import axios from "axios";

export default {
  name: "githubrepo",
  category: "search",
  command: ["ghsearch", "github"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan nama proyek.\nContoh: *.github baileys*");
    try {
      const { data } = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}&sort=stars&order=desc`);
      const repo = data.items.slice(0, 5)
        .map((r, i) => `${i + 1}. *${r.full_name}* ⭐ ${r.stargazers_count}\n${r.description || "-"}\n🔗 ${r.html_url}`)
        .join("\n\n");
      m.reply(`🐙 *Top hasil GitHub untuk:* ${text}\n\n${repo}`);
    } catch {
      m.reply("Tidak dapat mengambil hasil dari GitHub.");
    }
  }
}