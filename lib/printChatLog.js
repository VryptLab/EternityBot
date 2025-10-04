import chalk from "chalk";

export default function (m, conn) {
  const from = m.isGroup ? conn.chats[m.chat]?.subject || "Grup" : m.pushname || "Pribadi";
  const chatType = m.isGroup ? "Grup" : "Pribadi";

  const message = m.body || m.type;
  const time = new Date(m.timestamp * 1000).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  const label = (text, fgColor, bgColor) => chalk[fgColor].bgHex(bgColor)(` ${text} `);

  console.log(
    chalk.cyan(`\n┌─「 ${chalk.bold.yellow.bgHex("#000080")(" 📩 NEW MESSAGE ")} 」`) +
      `\n${chalk.cyan("│")} ${chalk.red("❒")} ${label("From", "yellow", "#000080")}   : ${chalk.green(from)}` +
      `\n${chalk.cyan("│")} ${chalk.red("❒")} ${label("Chat", "white", "#800080")}   : ${chalk.cyan(chatType)}` +
      `\n${chalk.cyan("│")} ${chalk.red("❒")} ${label("Message", "black", "#FFFF00")} : ${chalk.white(message)}` +
      `\n${chalk.cyan("│")} ${chalk.red("❒")} ${label("Time", "magenta", "#555555")}   : ${chalk.gray(time)}` +
      `\n${chalk.cyan("└" + "─".repeat(40))}\n`
  );
}