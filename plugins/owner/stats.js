import os from "os";

export default {
  name: "stats",
  category: "owner",
  command: ["stats"],
  settings: { owner: true },
  run: async (conn, m) => {
    const uptime = process.uptime();
    const used = process.memoryUsage();
    const format = s => (s / 1024 / 1024).toFixed(2);

    const msg = `📊 *Runtime Stats*
Uptime: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
RAM Used: ${format(used.heapUsed)}MB / ${format(used.heapTotal)}MB
CPU: ${os.cpus()[0].model}
Platform: ${os.platform().toUpperCase()}`;
    m.reply(msg);
  }
}