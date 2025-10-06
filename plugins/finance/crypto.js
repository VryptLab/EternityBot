export default {
    name: "crypto",
    category: "finance",
    command: ["crypto", "coin"],
    run: async (conn, m) => {
        const coin = m.text.trim().toLowerCase();
        if (!coin) return m.reply("💰 Contoh: .crypto bitcoin");

        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
        const data = await res.json();
        if (!data[coin]) return m.reply("❌ Coin tidak ditemukan.");

        m.reply(`💸 Harga ${coin.charAt(0).toUpperCase() + coin.slice(1)} saat ini: $${data[coin].usd}`);
    }
}