import readLine from "readline";
import chalk from "chalk";

function question(text) {
  return new Promise((resolve) => {
    const rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      `${chalk.bold.bgMagenta(`\x20?\x20`)}\x20${chalk.bold.magenta(
        "≻"
      )}\x20${chalk.bold(text)}:\x20`,
      (answer) => {
        resolve(answer);
        rl.close();
      }
    );
  });
}

export default question;
