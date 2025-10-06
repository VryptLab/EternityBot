export default {
    name: "cuaca",
    category: "utility",
    command: ["cuaca", "weather"],
    run: async (conn, m) => {
        const lokasi = m.text.trim();
        if (!lokasi) return m.reply("📍 Masukkan nama kota.\nContoh: .cuaca Jakarta");

        const res = await fetch(`https://wttr.in/${encodeURIComponent(lokasi)}?format=j1`);
        const data = await res.json();
        const info = data.current_condition[0];
        const msg = `🌦️ *Cuaca ${lokasi}*\n\n🌡️ Suhu: ${info.temp_C}°C\n💧 Kelembapan: ${info.humidity}%\n🌬️ Angin: ${info.windspeedKmph} km/h\n☁️ Kondisi: ${info.weatherDesc[0].value}`;
        m.reply(msg);
    }
}