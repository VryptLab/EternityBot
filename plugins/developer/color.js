export default {
    name: "color",
    category: "developer",
    command: ["color", "hex"],
    run: async (conn, m) => {
        const hex = m.text.replace("#", "").trim();
        if (!/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex))
            return m.reply("🎨 Masukkan kode hex valid.\nContoh: .color #00ff99");

        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        const rgb = `rgb(${r}, ${g}, ${b})`;
        const url = `https://singlecolorimage.com/get/${hex}/300x150`;
        await conn.sendMessage(m.chat, { image: { url }, caption: `🎨 *HEX:* #${hex}\n🌈 *RGB:* ${rgb}` });
    }
}