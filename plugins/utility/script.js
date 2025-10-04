export default {
    name: "script",
    category: "utility",
    command: ["sc", "script"],
    run: async (conn, m, { Func }) => {
        try {
            const res = await Func.fetchJson("https://api.github.com/repos/VryptLab/EternityBot");

            m.reply(`*Informasi Script*\n
◦ *Nama:* ${res.name}
◦ *Pemilik:* ${res.owner.login ?? "-"}
◦ *Star:* ${res.stargazers_count ?? 0}
◦ *Forks:* ${res.forks ?? 0}
◦ *Dibuat sejak:* ${Func.ago(res.created_at)}
◦️ *Terakhir update:* ${Func.ago(res.updated_at)}
◦ *Terakhir publish:* ${Func.ago(res.pushed_at)}
◦ *Link:* ${res.html_url}
`);

        } catch (err) {
            console.error(err);
            return m.reply("Coba lagi nanti.");
        }
    }
};