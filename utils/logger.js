import chalk from "chalk";
const { log } = console;

const logger = (type, event, text) => {
  try {
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const times = `${hours}:${minutes}:${seconds}`;

    switch (type?.toLowerCase()) {
      case "primary":
        log(
          `\n${chalk.blue(`┎╼[`)}${chalk.bold.bgBlue(
            `\x20Bayu Mahadika\x20`
          )}${chalk.blue(`]╾x╼[`)}${chalk.bold(
            `\x20ReybotVIP\x20`
          )}${chalk.blue("]╾x╼[")}${chalk.bold(`\x20${times}\x20`)}${chalk.blue(
            "]╾\x20✈"
          )}\n${chalk.blue("╉╼[")}${chalk.bold("Event")}${chalk.blue(
            "]≻"
          )}\x20${chalk.bold(`${event.toUpperCase()}`)}\n${chalk.blue(
            "┖"
          )}\x20${chalk.bold(`${text}`)}`
        );
        break;
      case "info":
        log(
          `\n${chalk.cyan(`┎╼[`)}${chalk.bold.bgCyan(
            `\x20Bayu Mahadika\x20`
          )}${chalk.cyan(`]╾x╼[`)}${chalk.bold(
            `\x20ReybotVIP\x20`
          )}${chalk.cyan("]╾x╼[")}${chalk.bold(`\x20${times}\x20`)}${chalk.cyan(
            "]╾\x20✈"
          )}\n${chalk.cyan("╉╼[")}${chalk.bold("Event")}${chalk.cyan(
            "]≻"
          )}\x20${chalk.bold(`${event.toUpperCase()}`)}\n${chalk.cyan(
            "┖"
          )}\x20${chalk.bold(`${text}`)}`
        );
        break;
      case "error":
        log(
          `\n${chalk.magenta(`┎╼[`)}${chalk.bold.bgMagenta(
            `\x20Bayu Mahadika\x20`
          )}${chalk.magenta(`]╾x╼[`)}${chalk.bold(
            `\x20ReybotVIP\x20`
          )}${chalk.magenta("]╾x╼[")}${chalk.bold(
            `\x20${times}\x20`
          )}${chalk.magenta("]╾\x20✈")}\n${chalk.magenta("╉╼[")}${chalk.bold(
            "Event"
          )}${chalk.magenta("]≻")}\x20${chalk.bold(
            `${event.toUpperCase()}`
          )}\n${chalk.magenta("┖")}\x20${chalk.bold(`${text}`)}`
        );
        break;
    }
  } catch (err) {
    console.log(err);
  }
};

export default logger;
