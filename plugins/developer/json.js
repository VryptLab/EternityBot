export default {
    name: "json",
    category: "developer",
    command: ["json", "formatjson"],
    run: async (conn, m) => {
        try {
            const raw = m.text.trim();
            if (!raw) return m.reply("🧾 Kirim JSON setelah command.\nContoh: .json {\"hello\": \"world\"}");
            const parsed = JSON.parse(raw);
            const formatted = "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
            m.reply(formatted);
        } catch {
            m.reply("❌ JSON tidak valid.");
        }
    }
}