export default {
    name: "randomreply",
    category: "fun",
    command: ["randomreply"],
    run: async (conn, m) => {
        const replies = [
            "Lagi ngapain, bos?",
            "Wih keren juga!",
            "Ngopi dulu, yuk ☕",
            "Aku bot, tapi setia 😎",
            "💀",
            "Mau aku jawab jujur atau lucu?"
        ];
        const pick = replies[Math.floor(Math.random() * replies.length)];
        m.reply(pick);
    }
}