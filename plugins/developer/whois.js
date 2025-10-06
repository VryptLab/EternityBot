export default {
    name: "whois",
    category: "developer",
    command: ["whois", "domain"],
    run: async (conn, m) => {
        const domain = m.text.trim().toLowerCase();
        if (!domain) return m.reply("🌐 Contoh: .whois google.com");

        const res = await fetch(`https://api.api-ninjas.com/v1/whois?domain=${domain}`, {
            headers: { "X-Api-Key": "YOUR_API_KEY" } // ambil dari https://api-ninjas.com
        });
        const data = await res.json();
        if (!data.domain_name) return m.reply("❌ Domain tidak ditemukan.");

        const info = `🌍 *WHOIS Result*\n
🕸️ Domain: ${data.domain_name}
📅 Dibuat: ${data.creation_date}
📅 Expired: ${data.expiration_date}
🏢 Registrar: ${data.registrar}
🌏 Negara: ${data.country || "-"}
📧 Email: ${data.registrant_email || "-"}
🔗 Server: ${data.name_servers.join(", ")}`;
        m.reply(info);
    }
}