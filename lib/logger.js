import chalk from "chalk";
import util from "util";

const levels = {
    info: { fg: "cyan", bg: "#000080", label: "INFO" },
    warn: { fg: "yellow", bg: "#8B4513", label: "WARN" },
    error: { fg: "red", bg: "#550000", label: "ERROR" },
    debug: { fg: "magenta", bg: "#333333", label: "DEBUG" },
    success: { fg: "green", bg: "#006400", label: "SUCCESS" },
};

const TZ_OFFSET = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
const BASE_OFFSET = new Date(TZ_OFFSET).getTime() - new Date().getTime();

function timestamp() {
    const now = new Date(Date.now() + BASE_OFFSET);
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    return chalk.gray(`${h}:${m}:${s}`);
}

const styledLabels = Object.entries(levels).reduce((acc, [key, { fg, bg, label }]) => {
    acc[key] = chalk[fg].bold.bgHex(bg)(` ${label} `);
    return acc;
}, {});

function formatMessage(level, message, ...args) {
    if (!args.length) {
        return `${timestamp()} ${styledLabels[level]} ${message}`;
    }

    const formattedArgs = args.map(arg =>
        typeof arg === "object"
            ? util.inspect(arg, { colors: true, depth: 2, compact: true })
            : arg
    );

    return `${timestamp()} ${styledLabels[level]} ${message} ${formattedArgs.join(" ")}`;
}

const logger = {
    info: (msg, ...args) => console.log(formatMessage("info", msg, ...args)),
    warn: (msg, ...args) => console.warn(formatMessage("warn", msg, ...args)),
    error: (msg, ...args) => console.error(formatMessage("error", msg, ...args)),
    debug: (msg, ...args) => console.log(formatMessage("debug", msg, ...args)),
    success: (msg, ...args) => console.log(formatMessage("success", msg, ...args)),
};

export default logger;