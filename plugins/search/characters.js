import axios from "axios";

export default {
  name: "character",
  category: "search",
  command: ["character", "char"],
  run: async (conn, m, { text }) => {
    if (!text) return m.reply("Masukkan nama karakter.\nContoh: *.char Luffy*");
    try {
      const query = {
        query: `query ($search: String) {
          Character(search: $search) {
            name { full }
            image { large }
            description(asHtml: false)
            siteUrl
          }
        }`,
        variables: { search: text }
      };
      const { data } = await axios.post("https://graphql.anilist.co", query, { headers: { "Content-Type": "application/json" } });
      const char = data.data.Character;
      await conn.sendMessage(m.chat, {
        image: { url: char.image.large },
        caption: `🎭 *${char.name.full}*\n\n${char.description?.slice(0, 400)}...\n🔗 ${char.siteUrl}`
      }, { quoted: m });
    } catch {
      m.reply("Karakter tidak ditemukan.");
    }
  }
}