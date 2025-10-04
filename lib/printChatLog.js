import chalk from "chalk";

export default function(m, conn) {
  const from = m.isGroup ? conn.chats[m.chat]?.subject : m.pushname;
  const chatType = m.isGroup ? `Grup (${chalk.yellow(m.sender)} : ${chalk.green(m.pushname)})` : "Pribadi";
  const message = m.body || m.type;
  const time = new Date(m.timestamp * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta'})

  console.log(
    chalk.cyan(`\n┌─「 ${chalk.bold.yellow("📩 NEW MESSAGE")} 」`) +
    `\n${chalk.cyan("│")} ${chalk.red("❒")} ${chalk.bold.green("From   :")} ${chalk.white(from)} ${chalk.gray("(" + m.chat + ")")}` +
    `\n${chalk.cyan("│")} ${chalk.red("❒")} ${chalk.bold.blue("Chat   :")} ${chalk.white(chatType)}` +
    `\n${chalk.cyan("│")} ${chalk.red("❒")} ${chalk.bold.magenta("Message:")} ${chalk.white(message)}` +
    `\n${chalk.cyan("│")} ${chalk.red("❒")} ${chalk.bold.green("Time   :")} ${chalk.white(time)}` +
    `\n${chalk.cyan("└" + "─".repeat(30))}\n`
  );
}