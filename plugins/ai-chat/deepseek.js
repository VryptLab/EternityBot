import { deepseek } from '#scrape';

export default {
    name: "deepseek",
    category: "ai-chat",
    command: ["deepseek", "dipsek"],
    run: async (conn, m) => {
        const input = m.isQuoted ? m.quoted.text : input;
        if (!input) return m.reply(`Masukkan pertanyaan atau perintah!\n\nContoh:\n${m.cmd} apa itu AI`);

        if (!conn.deepseek) conn.deepseek = {};
        if (!conn.deepseek[m.sender]) conn.deepseek[m.sender] = [];
        conn.deepseek[m.sender].push({ content: input, is_user: true });

        try {
            const res = await deepseek(input, conn.deepseek[m.sender]);
            const result = res.replace(/<think>[\s\S]*?<\/think>/gi, '')
                .replace(/&quot;/g, '"')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/&#039;/g, "'")
                .trim();
            conn.deepseek[m.sender].push({ content: res, is_user: false });
            m.reply(result)
        } catch (err) {
            console.error(err);
        }
    }
};