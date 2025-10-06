export default {
    name: "qrcode",
    category: "utils",
    command: ["qrcode", "qr"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Tulis teks atau URL yang ingin dijadikan QR.\nContoh: *.qr https://vrypt.my.id*");
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
        await conn.sendMessage(m.chat, { image: { url }, caption: "✅ QR Code berhasil dibuat" }, { quoted: m });
    }
}