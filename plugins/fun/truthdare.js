const truth = [
    "Apa rahasia terbesarmu?",
    "Siapa orang yang kamu suka diam-diam?",
    "Pernah bohong ke teman grup ini?"
];
const dare = [
    "Kirim voice note bilang 'aku cinta kalian semua' 😂",
    "Ganti nama profil selama 10 menit!",
    "Ketik pesan 'aku lapar' ke 3 orang random."
];

export default {
    name: "truthdare",
    category: "fun",
    command: ["truth", "dare"],
    settings: { group: true },
    run: async (conn, m, { command }) => {
        const list = command === "truth" ? truth : dare;
        const pick = list[Math.floor(Math.random() * list.length)];
        await m.reply(pick);
    }
}