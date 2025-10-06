export default {
    name: "berita",
    category: "news",
    command: ["berita", "news"],
    run: async (conn, m) => {
        const res = await fetch(`https://gnews.io/api/v4/top-headlines?lang=id&country=id&token=YOUR_API_KEY`);
        const data = await res.json();
        if (!data.articles?.length) return m.reply("Tidak ada berita saat ini.");

        const berita = data.articles.slice(0, 3).map((v, i) => 
            `📰 *${i + 1}. ${v.title}*\n${v.description || ''}\n🔗 ${v.url}`
        ).join("\n\n");
        m.reply(`🇮🇩 *Berita Terbaru:*\n\n${berita}`);
    }
}