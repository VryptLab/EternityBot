export default {
    name: "time",
    category: "utility",
    command: ["time", "jam"],
    run: async (conn, m) => {
        const now = new Date();
        const text = now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        m.reply(`🕒 Sekarang jam *${text}* WIB`);
    }
}