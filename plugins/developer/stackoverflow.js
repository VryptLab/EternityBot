export default {
    name: "stackoverflow",
    category: "developer",
    command: ["so", "stack"],
    run: async (conn, m) => {
        const query = m.text.trim();
        if (!query) return m.reply("🧠 Contoh: .so How to use async/await in Node.js");

        const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow`);
        const data = await res.json();
        if (!data.items?.length) return m.reply("❌ Tidak ada hasil ditemukan.");

        const top = data.items.slice(0, 3)
            .map((q, i) => `🟢 *${i + 1}. ${q.title}*\n👤 ${q.owner.display_name}\n💬 ${q.answer_count} jawaban\n🔗 ${q.link}`)
            .join("\n\n");
        m.reply(`📚 *Hasil Pencarian Stack Overflow:*\n\n${top}`);
    }
}