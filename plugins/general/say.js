export default {
    name: "say",
    category: "general",
    command: ["say", "repeat"],
    run: async (conn, m) => {
        if (!m.text) return m.reply("Ketik sesuatu untuk diulang!");
        m.reply(m.text);
    }
}