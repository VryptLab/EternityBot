export default {
    name: "repo",
    category: "developer",
    command: ["repo", "ghrepo"],
    run: async (conn, m) => {
        const text = m.text.trim();
        if (!text.includes("/")) return m.reply("📁 Contoh: .repo VryptLab/EternityBot");

        const res = await fetch(`https://api.github.com/repos/${text}`);
        const data = await res.json();
        if (data.message) return m.reply("❌ Repo tidak ditemukan.");

        const caption = `📦 *${data.full_name}*
🧾 ${data.description || "-"}
⭐ Stars: ${data.stargazers_count}
🍴 Forks: ${data.forks_count}
🧩 Issues: ${data.open_issues_count}
🕒 Updated: ${new Date(data.updated_at).toLocaleString("id-ID")}
🔗 ${data.html_url}`;
        await conn.sendMessage(m.chat, { image: { url: data.owner.avatar_url }, caption });
    }
}