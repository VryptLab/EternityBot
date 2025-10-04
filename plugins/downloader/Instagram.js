import { instagram } from '#scrape';

export default {
    name: "instagram",
    category: "downloader",
    command: ["igdl", "ig"],
    run: async (conn, m) => {
        try {
            const input = m.isQuoted ? m.quoted.text : m.text;
            const regex = /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?)/;
            const parseUrl = input.match(regex)?.[0];

            if (!parseUrl) {
                return m.reply(
                    `# Cara Penggunaan\n\n` +
                    `> Masukkan URL Instagram untuk mengunduh konten\n\n` +
                    `# Contoh Penggunaan\n` +
                    `> *${m.cmd} https://www.instagram.com/*`
                );
            }

            const res = await instagram(parseUrl)

            if (res.error) return m.reply("Gagal ambil konten dari Instagram~");

            const result = res.info;

            if (res.media_type === 'photo') {
                if (result.length > 1) {
                    const medias = result.map(v => ({
                        image: { url: v.url }
                    }));

                    await conn.sendAlbumMessage(m.chat, medias, { quoted: m, delay: 5000 });

                }

                if (result.length === 1) {
                    m.reply({
                        image: { url: result[0].url },
                        caption: 'kyah'
                    });
                }
            } else {
                m.reply({ video: { url: result[0].url }, caption: 'Berhasil mengunduh video' });
            }
        } catch (err) {
            console.error("Instagram Error:", err.message);
            m.reply("Ada error waktu ambil media IG-nya~");
        }
    },
};