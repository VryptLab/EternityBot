export default {
    name: "calc",
    category: "tools",
    command: ["calc", "hitung"],
    run: async (conn, m) => {
        if (!m.text) return m.reply("Contoh: .calc 10 * (5 + 2)");
        try {
            const result = Function(`"use strict"; return (${m.text})`)();
            m.reply(`Hasil: *${result}*`);
        } catch {
            m.reply("Ekspresi tidak valid!");
        }
    }
}