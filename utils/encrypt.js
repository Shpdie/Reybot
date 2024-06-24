import obfuscator from "javascript-obfuscator";
import { readFile, writeFile } from "fs";

const files = [
  "lib/Downloader.js",
  "lib/ReybotVIP.js",
  "utils/encrypt.js",
  "utils/logger.js",
  "utils/question.js",
  "command.js",
  "main.js",
  "test.js",
];

function obfuscated(filePath) {
  readFile(`${process.cwd()}/${filePath}`, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    const obfuscatedCode = obfuscator
      .obfuscate(data, {
        compact: true,
        renameGlobals: true,
        splitStrings: true,
        unicodeEscapeSequence: true,
      })
      .getObfuscatedCode();
    writeFile(`${process.cwd()}/reybot/${filePath}`, obfuscatedCode, (err) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(`Berhasil encrypt file ${filePath}`);
    });
  });
}

files.forEach((file) => obfuscated(file));
