import makeWASocket, {
  useMultiFileAuthState,
  makeInMemoryStore,
} from "@whiskeysockets/baileys";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import Pino from "pino";
import NodeCache from "node-cache";

import { Downloader } from "./Downloader.js";
import logger from "../utils/logger.js";
import question from "../utils/question.js";
import { caseCommand } from "../command.js";

const iNumber = process.argv.findIndex((val) => val.startsWith("--number"));
let useCode = false;

if (iNumber >= 0) {
  useCode = true;
}

export class ReybotVIP {
  reybot;
  #reybotSocket;
  qr;
  #path;
  #store;
  #setting;
  downloader;
  constructor() {
    this.#reybotSocket = makeWASocket.default;
    this.#store = makeInMemoryStore({
      logger: Pino({ level: "silent" }).child({ level: "silent" }),
    });
    this.downloader = new Downloader();
  }
  #init = async () => {
    this.#path = `${process.cwd()}/data`;
    this.#setting = await this.#loadSetting();
    if (this.#setting.fitur.useCode) {
      useCode = true;
    }
    this.#store.readFromFile(`${this.#path}/store.json`);
    await mkdir(this.#path, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(
      `${this.#path}/auth`
    );
    const msgRetryCounterCache = new NodeCache();
    this.reybot = this.#reybotSocket({
      syncFullHistory: true,
      browser: ["Chrome (Linux)", "", ""],
      defaultQueryTimeoutMs: undefined,
      generateHighQualityLinkPreview: true,
      logger: Pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: !useCode,
      msgRetryCounterCache,
    });
    this.#store.bind(this.reybot.ev);
    this.#readOrWriteStore();
    this.#store.contactsAreSaved = Object.values(this.#store.contacts).filter(
      (contact) => contact.id.endsWith(".net") && contact.name
    );
    this.#store.contactsAreNotSaved = Object.values(
      this.#store.contacts
    ).filter((contact) => contact.id.endsWith(".net") && !contact.name);
    if (
      useCode &&
      !this.reybot.user &&
      !this.reybot.authState.creds.registered
    ) {
      const connectUsingCode = async () => {
        try {
          let phoneNumber =
            process.argv[iNumber]?.split("=")[1] || this.#setting?.bot?.number;
          if (!phoneNumber) {
            phoneNumber = await question("Masukkan nomor whatsapp anda\n\n");
          }
          while (true) {
            if (isNaN(phoneNumber)) {
              logger(
                "error",
                "REQUEST PAIRING CODE",
                "Nomor yang anda berikan tidak valid type number"
              );
              phoneNumber = await question("Masukkan nomor whatsapp anda\n\n");
              if (this.#setting.bot.number) {
                this.#setting.bot.number = phoneNumber;
                await writeFile(
                  `${process.cwd()}/setting.json`,
                  JSON.stringify(this.#setting)
                );
              }
            } else {
              break;
            }
          }
          logger(
            "info",
            "REQUEST PAIRING CODE",
            `Request pairing code untuk nomor whatsapp ${phoneNumber}`
          );
          setTimeout(async () => {
            let code = await this.reybot.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            logger(
              `primary`,
              "KONEKSI",
              `Pairing code anda (${phoneNumber}): ${code}`
            );
          }, 5000);
        } catch (err) {
          logger("error", "CONNECT USING CODE", err);
        }
      };
      await connectUsingCode();
    }
    this.reybot.ev.on("connection.update", this.#connection);
    this.reybot.ev.on("creds.update", saveCreds);
  };
  run = async () => {
    await this.#init();
    this.reybot.ev.on("call", this.#call);
    this.reybot.ev.on("group-participants.update", this.#group);
    this.reybot.ev.on("messages.upsert", this.#messages);
  };
  #connection = async (c) => {
    const { connection, qr, lastDisconnect } = c;
    this.qr = qr;
    if (connection === "close") {
      const { statusCode, error, message } =
        lastDisconnect.error.output.payload;
      if (statusCode === 401 && error === "Unauthorized") {
        logger("error", "KONEKSI", message);
        await rm(this.#path, { recursive: true });
      } else if (statusCode === 405 && error === "Method Not Allowed") {
        logger("error", "KONEKSI", message);
        await rm(this.#path, { recursive: true });
      }
      if (statusCode === 408 && error === "Request Time-out") {
        logger("error", "KONEKSI", message);
      }
      if (statusCode === 428 && error === "Precondition Required") {
        logger("error", "KONEKSI", message);
      }
      if (statusCode === 515 && error === "Unknown") {
        logger("error", "KONEKSI", message);
      } else {
        console.log(lastDisconnect.error.output.payload);
      }
      return this.run();
    }
    if (connection === "connecting") {
      logger("info", "KONEKSI", "Menghubungkan");
    }
    if (connection === "open") {
      logger(
        "primary",
        "KONEKSI",
        `Terhubung dengan ${this.reybot.user.name}(${
          this.reybot.user.id.split(":")[0]
        })`
      );
    }
  };
  #call = async (c) => {
    const { id, from, status } = c[0];
    if (this.#setting.fitur.antiCall && status === "offer") {
      await this.reybot.rejectCall(id, from);
      logger(
        "primary",
        "ANTI CALL",
        `Berhasil menolak panggilan dari ${from.split("@")[0]}`
      );
    }
  };
  #group = async (g) => {
    const { id, participants, action } = g;
    const isMyGroup = this.#setting.groups.some((v) => v === id);
    if (this.#setting.fitur.greetings && isMyGroup) {
      let text = "";
      if (action === "add") {
        text = `*Selamat datang ${participants
          .map((v) => `@${v.split("@")[0]}`)
          .join(
            " "
          )}*\x20👋\nSemoga betah di group ini\n\nBerikut adalah beberapa perintah yang dapat anda gunakan:\n`;
      } else if (action === "remove") {
        text = `*Selamat jalan ${participants
          .map((v) => `@${v.split("@")[0]}`)
          .join(" ")}*\x20👻\nSemoga tenang dialam sana\n`;
      }
      return this.reybot.sendMessage(id, { text, mentions: participants });
    }
  };
  #messages = async (m) => {
    const msg = m.messages[0];
    if (!msg.message || (msg.key && msg.key.remoteJid === "status@broadcast"))
      return;
    const id = msg.key.remoteJid;
    let userId = id;
    const type = Object.keys(msg.message)[0];
    const text =
      type === "conversation"
        ? msg.message.conversation
        : type === "extendedTextMessage"
        ? msg.message.extendedTextMessage.text
        : type === "imageMessage"
        ? msg.message.imageMessage.caption
        : type === "videoMessage"
        ? msg.message.videoMessage.caption
        : "";
    const isGroup = id.endsWith("g.us");
    let groupMetadata = null;
    let participants = null;
    let isMyGroup = false;
    let isAdminGroup = false;
    let botIsAdminGroup = false;
    const textLink = text.match(
      /(http:\/\/|https:\/\/)?(www\.)?[a-zA-Z0-9]+\.[a-zA-Z]+(\.[a-zA-Z]+)?(\/[^\s]*)?/g
    );
    if (isGroup) {
      userId = msg.key.participant;
      isMyGroup = this.#setting.groups.some((v) => v === id);
    }
    const fromMe = msg.key.fromMe;
    const isOwner = `${this.#setting.owner.number}@s.whatsapp.net` === userId;
    if (this.#setting.fitur.antiLink && isMyGroup && textLink) {
      groupMetadata = await this.reybot.groupMetadata(id);
      groupMetadata.participants.forEach((v) => {
        if (
          v.id === userId &&
          (v.admin === "admin" || v.admin === "superadmin")
        ) {
          isAdminGroup = true;
        }
        if (
          v.id === `${this.#setting.bot.number}@s.whatsapp.net` &&
          (v.admin === "admin" || v.admin === "superadmin")
        ) {
          botIsAdminGroup = true;
        }
      });
      if (fromMe || isOwner || isAdminGroup) {
        return;
      }
      if (!botIsAdminGroup) {
        return;
      }
      const resLoading = await this.reybot.sendMessage(
        id,
        { text: "Loading...", mentions: [userId] },
        { quoted: msg }
      );
      await this.reybot.sendMessage(id, { delete: msg.key });
      return this.reybot.sendMessage(id, {
        text: `✨\x20*${
          this.#setting.bot.name
        }\x20ヅ*\x20\x20|\x20*Anti Link*\n\n*Hallo ka @${
          userId.split("@")[0]
        }*\nDigroup ini dilarang keras untuk membagikan sebuah *_pesan link_.*\n*Dengan _berat hati_ kami menghapus pesan anda _Terima kasih_.*\n`,
        edit: resLoading.key,
      });
    }

    if (!text.startsWith(this.#setting.prefix || ".")) return;
    const command = text.toLowerCase().substring(1).split(" ")[0].trim();
    const args = text
      .replace(/.(.+?)\s*\b/i, "")
      .trim()
      .split(" ");
    return caseCommand(
      this.reybot,
      this.#store,
      this.#loadSetting,
      msg,
      id,
      userId,
      type,
      text,
      isGroup,
      groupMetadata,
      participants,
      isMyGroup,
      isAdminGroup,
      botIsAdminGroup,
      fromMe,
      isOwner,
      command,
      args
    );
  };
  #readOrWriteStore = () =>
    setInterval(() => {
      const fileStore = `${this.#path}/store.json`;
      this.#store.readFromFile(fileStore);
      this.#store.writeToFile(fileStore);
    }, 5000);
  #loadSetting = async () => {
    try {
      let setting = await readFile(`${process.cwd()}/setting.json`);
      return JSON.parse(setting);
    } catch (err) {
      setting = {
        bot: {
          name: "",
          number: "",
        },
        owner: {
          name: "",
          number: "",
        },
        groups: [],
        fitur: {
          useCode: false,
          antiCall: false,
          antiLink: false,
          greetings: false,
        },
      };

      setting.bot.name = await question("Nama bot");
      setting.bot.number = await question("Nomor bot");
      setting.owner.name = await question("Nama owner");
      setting.owner.number = await question("Nomor owner");
      setting.fitur.useCode = await question("Terhubung menggunakan kode Y/n");
      if (setting.fitur.useCode.toLowerCase() !== "n") {
        setting.fitur.useCode = true;
      }
      setting.fitur.antiCall = await question("Menolak semua panggilan Y/n");
      if (setting.fitur.antiCall.toLowerCase() !== "n") {
        setting.fitur.antiCall = true;
      }
      setting.fitur.antiLink = await question(
        "Hapus pesan link pada group Y/n"
      );
      if (setting.fitur.antiLink.toLowerCase() !== "n") {
        setting.fitur.antiLink = true;
      }
      setting.fitur.greetings = await question(
        "Sapaan kepada member bergabung atau keluar group Y/n"
      );
      if (setting.fitur.greetings.toLowerCase() !== "n") {
        setting.fitur.greetings = true;
      }

      await writeFile(`${process.cwd()}/setting.json`, JSON.stringify(setting));
      return setting;
    }
  };
}
