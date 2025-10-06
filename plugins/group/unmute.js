export default {
    name: "unmute",
    category: "group",
    command: ["unmute"],
    settings: { group: true, admin: true, botAdmin: true },
    run: async (conn, m) => {
        await conn.groupSettingUpdate(m.chat, "not_announcement");
        m.reply("🔊 Grup dibuka kembali — semua anggota bisa mengirim pesan.");
    }
}