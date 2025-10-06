export default {
    name: "reverse",
    category: "fun",
    command: ["reverse"],
    run: async (conn, m) => {
        if (!m.text) return m.reply("Contoh: .reverse vrypt");
        const reversed = m.text.split("").reverse().join("");
        m.reply(reversed);
    }
}