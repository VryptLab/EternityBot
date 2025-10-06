export default {
    name: "fancy",
    category: "fun",
    command: ["fancy"],
    run: async (conn, m) => {
        if (!m.text) return m.reply("Contoh: .fancy vrypt");
        const fancy = m.text
            .toLowerCase()
            .replace(/[a-z]/g, c => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 97)));
        m.reply(fancy);
    }
}