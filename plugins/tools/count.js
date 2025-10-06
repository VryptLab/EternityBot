export default {
    name: "count",
    category: "tools",
    command: ["count"],
    run: async (conn, m) => {
        if (!m.text) return m.reply("Contoh: .count ini contoh kalimat");
        const words = m.text.trim().split(/\s+/).length;
        const chars = m.text.replace(/\s/g, "").length;
        m.reply(`Kata: *${words}*\nHuruf: *${chars}*`);
    }
}