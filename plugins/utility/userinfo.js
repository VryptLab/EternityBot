export default {
    name: "userinfo",
    category: "utility",
    command: ["me", "userinfo"],
    run: async (conn, m) => {
        const bio = await conn.fetchStatus(m.sender).catch(() => ({ status: "Tidak ada bio" }));
        const pp = await conn.profilePictureUrl(m.sender, "image").catch(() => null);
        const info = `
👤 *Nama:* ${m.pushName || "Tanpa Nama"}
📱 *Nomor:* @${m.sender.split("@")[0]}
🗒️ *Bio:* ${bio.status || "-"}
        `.trim();
        if (pp) await conn.sendMessage(m.chat, { image: { url: pp }, caption: info, mentions: [m.sender] });
        else m.reply(info, null, { mentions: [m.sender] });
    }
}