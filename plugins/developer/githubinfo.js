export default {
    name: "github",
    category: "developer",
    command: ["github", "gh"],
    run: async (conn, m) => {
        const user = m.text.trim();
        if (!user) return m.reply("🧑‍💻 Contoh: .github VryptLab");

        const res = await fetch(`https://api.github.com/users/${user}`);
        const data = await res.json();
        if (data.message) return m.reply("❌ User tidak ditemukan.");

        const caption = `👤 *${data.name || user}*\n📍 ${data.location || "-"}\n💬 ${data.bio || "-"}\n📦 Repo: ${data.public_repos}\n👥 Followers: ${data.followers}\n🔗 ${data.html_url}`;
        await conn.sendMessage(m.chat, { image: { url: data.avatar_url }, caption });
    }
}