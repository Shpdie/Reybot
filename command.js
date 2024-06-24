import { Downloader } from "./lib/Downloader.js";
import { basename } from "path";
import { rm } from "fs/promises";
import Crypto from "crypto";
import { readFileSync, rmSync } from "fs";
import logger from "./utils/logger.js";

const downloader = new Downloader();

async function caseCommand(
  reybot,
  store,
  loadSetting,
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
) {
  const setting = await loadSetting();
  const hTxt = `✨\x20*${
    setting.bot.name
  }\x20ヅ*\x20\x20|\x20*${command.toUpperCase()}*\n\n`;
  const logCommand = () => {
    logger("info", "COMMAND", command.toUpperCase());
  };
  const reply = async (text) => {
    const resLoading = await reybot.sendMessage(
      id,
      { text: "Loading...", mentions: [userId] },
      { quoted: msg }
    );
    return reybot.sendMessage(id, {
      text: `${hTxt}${text}`,
      edit: resLoading.key,
    });
  };
  switch (command) {
    case "menu":
    case "mn":
      logCommand();
      try {
        let mnFitur = `*Main Menu:*\n>\x20*•.Menu*\n>\x20*•.TiktokVideo*\n`;
        const mnNotes = ``;
        if (fromMe || isOwner) {
          mnFitur = `*Admin Menu:*\n\n*Main Menu:*\n>\x20*•.Menu*\n>\x20*•.TiktokVideo*\n>\x20*•.TiktokMusic*\n>\x20*•.TiktokImages*\n>\x20*•.YtVideo*\n>\x20*•.YtMusic*\n`;
        }
        reybot.sendMessage(
          id,
          {
            image: { url: `${process.cwd()}/ReybotVIP.jpg` },
            caption: `${hTxt}${mnFitur}`,
          },
          { quoted: msg }
        );
      } catch (err) {
        logger("error", "MENU", err);
        reply(err);
      }
      break;
    case "tiktokvideo":
    case "tiktokv":
      logCommand();
      try {
        if (!args[0] || args[0] === "") {
          return reply("Url dibutuhkan");
        }
        const resRTVideo = await reybot.sendMessage(
          id,
          { text: "Sedang mendownload..." },
          { quoted: msg }
        );
        const resTVideo = await downloader.tiktok(args[0], "video");
        await reybot.sendMessage(id, { delete: resRTVideo.key });
        if (!resTVideo.filepath) {
          return reply("Gagal mendownload, coba lagi...");
        }
        await reybot.sendMessage(
          id,
          {
            document: readFileSync(resTVideo.filepath),
            fileName: resTVideo.filename,
            caption: "Download selesai",
            mimetype: "video/mp4",
          },
          { quoted: msg }
        );

        rmSync(resTVideo.filepath);
      } catch (err) {
        logger("error", "Tiktok Video", err);
        reply(err);
      }
      break;
    case "tiktokmusic":
    case "tiktokmusik":
    case "tiktokm":
      logCommand();
      try {
        if (!args[0] || args[0] === "") {
          return reply("Url dibutuhkan");
        }
        const resRTMusic = await reybot.sendMessage(
          id,
          { text: "Sedang mendownload..." },
          { quoted: msg }
        );
        const resTMusic = await downloader.tiktok(args[0], "music");
        await reybot.sendMessage(id, { delete: resRTMusic.key });

        if (!resTMusic.filepath) {
          return reply("Gagal mendownload, coba lagi...");
        }

        await reybot.sendMessage(
          id,
          {
            document: readFileSync(resTMusic.filepath),
            fileName: resTMusic.filename,
            caption: "Download selesai",
            mimetype: "audio/mp3",
          },
          { quoted: msg }
        );
        rmSync(resTMusic.filepath);
      } catch (err) {
        logger("error", "Tiktok Music", err);
        reply(err);
      }
      break;
    case "tiktokimages":
    case "tiktokimage":
    case "tiktoki":
      logCommand();
      try {
        if (!args[0] || args[0] === "") {
          return reply("Url dibutuhkan");
        }
        const resRTImages = await reybot.sendMessage(
          id,
          { text: "Sedang mendownload..." },
          { quoted: msg }
        );
        const resTImages = await downloader.tiktok(args[0], "images");
        await reybot.sendMessage(id, { delete: resRTImages.key });

        if (resTImages.length < 0) {
          return reply("Gagal mendownload, coba lagi...");
        }
        for (let i = 0; resTImages.length > i; i++) {
          await reybot.sendMessage(
            id,
            {
              document: readFileSync(resTImages[i].filepath),
              fileName: resTImages[i].filename,
              caption: "Download selesai",
              mimetype: "image/png",
            },
            { quoted: msg }
          );
          rmSync(resTImages[i].filepath);
        }
      } catch (err) {
        logger("error", "Tiktok Images", err);
        reply(err);
      }
      break;
    case "youtubevideo":
    case "ytvideo":
      logCommand();
      if (!args[0] || args[0] === "") {
        return reply("Url dibutuhkan");
      }
      try {
        const resRYTVideo = await reybot.sendMessage(
          id,
          { text: "Sedang mendownload..." },
          { quoted: msg }
        );
        const resYTVideo = await downloader.youtube(args[0], "video");
        await reybot.sendMessage(id, { delete: resRYTVideo.key });
        if (!resYTVideo.filepath) {
          return reply("Video gagal didownload, coba lagi...");
        }
        await reybot.sendMessage(
          id,
          {
            document: readFileSync(resYTVideo.filepath),
            fileName: resYTVideo.filename,
            caption: "Download selesai",
            mimetype: "video/mp4",
          },
          { quoted: msg }
        );
        rmSync(resYTVideo.filepath);
      } catch (err) {
        logger("error", "YOUTUBE VIDEO", err);
        reply(err);
      }
      break;
    case "youtubemusic":
    case "ytmusic":
      logCommand();
      if (!args[0] || args[0] === "") {
        return reply("Url dibutuhkan");
      }
      try {
        const resRYTMusic = await reybot.sendMessage(
          id,
          { text: "Sedang mendownload..." },
          { quoted: msg }
        );
        const resYTMusic = await downloader.youtube(args[0], "music");
        await reybot.sendMessage(id, { delete: resRYTMusic.key });
        if (!resYTMusic.filepath) {
          return reply("Music gagal didownload, coba lagi...");
        }
        await reybot.sendMessage(
          id,
          {
            document: readFileSync(resYTMusic.filepath),
            fileName: resYTMusic.filename,
            caption: "Download selesai",
            mimetype: "audio/mp3",
          },
          { quoted: msg }
        );
        rmSync(resYTMusic.filepath);
      } catch (err) {
        logger("error", "YOUTUBE MUSIC", err);
        reply(err);
      }
      break;
    default:
      console.log(command);
      break;
  }
  return;
}

export { caseCommand };
