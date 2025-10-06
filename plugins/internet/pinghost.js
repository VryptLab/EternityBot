import { exec } from "child_process";

export default {
    name: "pinghost",
    category: "internet",
    command: ["pinghost", "pingip"],
    settings: {},
    run: async (conn, m, { text }) => {
        if (!text) return m.reply("Contoh: *.pinghost google.com*");
        exec(`ping -c 3 ${text}`, (err, stdout) => {
            if (err) return m.reply("Gagal melakukan ping.");
            m.reply(`📡 *Ping ke ${text}:*\n\n${stdout}`);
        });
    }
}