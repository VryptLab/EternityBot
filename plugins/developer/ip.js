export default {
    name: "ip",
    category: "developer",
    command: ["ip", "ipinfo"],
    run: async (conn, m) => {
        const ip = m.text.trim();
        if (!ip) return m.reply("📡 Contoh: .ip 8.8.8.8");

        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await res.json();
        if (data.error) return m.reply("❌ IP tidak valid.");

        const info = `📍 *IP Info*\n
🔢 IP: ${data.ip}
🌏 Negara: ${data.country_name} (${data.country_code})
🏙️ Kota: ${data.city || "-"}
🏢 ISP: ${data.org || "-"}
🧭 Lokasi: ${data.latitude}, ${data.longitude}`;
        m.reply(info);
    }
}