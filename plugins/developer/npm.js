export default {
    name: "npm",
    category: "developer",
    command: ["npm", "npmjs"],
    run: async (conn, m) => {
        const query = m.text.trim();
        if (!query) return m.reply("📦 Masukkan nama package npm.\nContoh: .npm express");

        const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(query)}`);
        if (res.status !== 200) return m.reply("❌ Package tidak ditemukan.");
        const data = await res.json();
        const latest = data["dist-tags"]?.latest;
        const version = data.versions[latest];

        const info = `📦 *${data.name}* (${latest})
🧩 Versi: ${latest}
👤 Author: ${version.author?.name || "-"}
📄 Deskripsi: ${data.description || "-"}
🕒 Terbit: ${new Date(data.time[latest]).toLocaleString("id-ID")}
🔗 https://www.npmjs.com/package/${data.name}`;

        m.reply(info);
    }
}