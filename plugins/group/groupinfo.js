export default {
    name: "groupinfo",
    category: "group",
    command: ["groupinfo", "infogroup"],
    settings: {
        group: true
    },
    run: async (conn, m, { metadata }) => {
        const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id;
        const desc = metadata.desc || 'Tidak ada deskripsi grup.';
        const text = `
*Nama:* ${metadata.subject}
*ID:* ${metadata.id}
*Owner:* @${owner?.split('@')[0]}
*Anggota:* ${metadata.size}
*Deskripsi:*
${desc}
        `.trim();
        await conn.sendMessage(m.chat, { text, mentions: [owner] });
    }
}