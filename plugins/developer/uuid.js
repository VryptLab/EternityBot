import { randomUUID } from "crypto";

export default {
    name: "uuid",
    category: "developer",
    command: ["uuid", "guid"],
    run: async (conn, m) => {
        const id = randomUUID();
        m.reply(`🧩 *UUID Generated:*\n${id}`);
    }
}