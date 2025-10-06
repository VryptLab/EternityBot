export default {
    name: "dns",
    category: "developer",
    command: ["dns", "dig"],
    run: async (conn, m) => {
        const domain = m.text.trim();
        if (!domain) return m.reply("📡 Contoh: .dns github.com");

        const res = await fetch(`https://dns.google/resolve?name=${domain}`);
        const data = await res.json();
        if (!data.Answer) return m.reply("❌ Tidak ada hasil DNS.");

        const records = data.Answer.map(v => `${v.type === 1 ? 'A' : v.type === 5 ? 'CNAME' : v.type}: ${v.data}`).join("\n");
        m.reply(`🌐 *DNS Record ${domain}:*\n${records}`);
    }
}