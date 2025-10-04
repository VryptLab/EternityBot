import chalk from "chalk";

const BORDER = chalk.cyan("│");
const BULLET = chalk.red("❒");
const SEPARATOR = chalk.cyan("└" + "─".repeat(40));

const HEADER = chalk.cyan(`\n┌─「 ${chalk.bold.yellow.bgHex("#000080")(" 📩 NEW MESSAGE ")} 」`);

const LABELS = {
  from: chalk.yellow.bgHex("#000080")(" From "),
  chat: chalk.white.bgHex("#800080")(" Chat "),
  message: chalk.black.bgHex("#FFFF00")(" Message "),
  time: chalk.magenta.bgHex("#555555")(" Time "),
};

const TIME_OPTIONS = {
  timeZone: "Asia/Jakarta",
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export default function (m, conn) {
  const from = m.isGroup ? conn.chats[m.chat]?.subject || "Grup" : m.pushname || "Pribadi";
  const chatType = m.isGroup ? "Grup" : "Pribadi";
  const message = m.body || m.type;
  const time = new Date(m.timestamp * 1000).toLocaleString("id-ID", TIME_OPTIONS);

  console.log(
    `${HEADER}\n${BORDER} ${BULLET} ${LABELS.from}   : ${chalk.green(from)}\n${BORDER} ${BULLET} ${LABELS.chat}   : ${chalk.cyan(chatType)}\n${BORDER} ${BULLET} ${LABELS.message} : ${chalk.white(message)}\n${BORDER} ${BULLET} ${LABELS.time}   : ${chalk.gray(time)}\n${SEPARATOR}\n`
  );
}