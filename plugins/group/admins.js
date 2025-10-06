export default {
    name: "admins",
    category: "group",
    command: ["admins"],
    settings: { group: true },
    run: async (conn, m, { metadata }) => {
        const admins = metadata.participants.filter(v => v.admin);
        const list = admins.map(v => `• @${v.id.split("@")[0]}`).join("\n");
        m.reply(`Daftar admin grup:\n\n${list}`, null, { mentions: admins.map(v => v.id) });
    }
}