import axios from "axios";

export default {
    name: "pickup",
    category: "fun",
    command: ["pickup", "gombal"],
    settings: {},
    run: async (conn, m) => {
        try {
            const res = await axios.get("https://vinuxd.vercel.app/api/pickup");
            await m.reply(`💘 ${res.data.data}`);
        } catch {
            const backup = [
                "Kamu punya peta? Aku tersesat di matamu.",
                "Kalau kamu jadi algoritma, aku mau terus nge-loop bersamamu.",
                "Kamu kayak console.log() — bikin aku senyum tiap lihat hasilnya."
            ];
            const line = backup[Math.floor(Math.random() * backup.length)];
            await m.reply(`💞 ${line}`);
        }
    }
}