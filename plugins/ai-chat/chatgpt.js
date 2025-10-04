import { chatgpt } from '#scrape';

export default {
    name: "chatgpt",
    category: "ai-chat",
    command: ["chatgpt", "gpt"],
    run: async (conn, m) => {
        const input = m.isQuoted ? m.quoted.text : m.text;
        if (!input) return m.reply(`Masukkan pertanyaan atau perintah!\n\nContoh:\n${m.cmd} apa itu AI`);

        if (!conn.chatgpt) conn.chatgpt = {};
        if (!conn.chatgpt[m.sender]) conn.chatgpt[m.sender] = [];
        conn.chatgpt[m.sender].push({ role: "user", content: input });
        try {
            const res = await gpt("gpt-4o-nano", conn.chatgpt[m.sender]);

            conn.chatgpt[m.sender].push({ role: "assistant", content: res });
            m.reply(res)
        } catch (err) {
            console.error(err);
        }
    }
};
