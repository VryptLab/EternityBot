export default {
    name: "mute",
    category: "group",
    command: ["mute"],
    settings: { group: true, admin: true, botAdmin: true },
    run: async (conn, m) => {
        await conn.groupSettingUpdate(m.chat, "announcement");
        m.reply("🔇 Grup dimute — hanya admin yang bisa mengirim pesan.");
    }
}