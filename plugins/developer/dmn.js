export default {
    name: "mdn",
    category: "developer",
    command: ["mdn"],
    run: async (conn, m) => {
        const query = m.text.trim();
        if (!query) return m.reply("📘 Contoh: .mdn Array.prototype.map");

        const res = await fetch(`https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(query)}&locale=en-US`);
        const data = await res.json();
        if (!data.documents?.length) return m.reply("❌ Tidak ada hasil.");

        const doc = data.documents[0];
        const caption = `📚 *${doc.title}*\n\n${doc.summary}\n\n🔗 https://developer.mozilla.org${doc.mdn_url}`;
        m.reply(caption);
    }
}