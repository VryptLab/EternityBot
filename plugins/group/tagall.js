export default {
    name: "tagall",
    category: "group",
    command: ["tagall", "everyone"],
    settings: {
        group: true,
        admin: true,
    },
    run: async (conn, m, { metadata }) => {
        const text = m.text ? m.text : 'Semua anggota disebut!';
        const mentions = metadata.participants.map(v => v.id);
        await conn.sendMessage(m.chat, {
            text: text + '\n\n' + mentions.map(x => `@${x.split('@')[0]}`).join(' '),
            mentions
        });
    }
}