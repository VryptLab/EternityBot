import { ceknsfw } from '#scrape';

export default {
    name: "ceknsfw",
    category: "tools",
    command: ["ceknsfw"],
    run: async (conn, m, { quoted }) => {
        if (!/image/.test(quoted.msg.mimetype)) return m.reply(`Kirim/Reply Foto Dengan Caption ${m.cmd}`);
        let media = await quoted.download();
        let res = await ceknsfw(media)
        m.reply(`Hasil Pengecekan:\nStatus: ${res.status}\nPersentase: ${res.persentase}`)
    }
};