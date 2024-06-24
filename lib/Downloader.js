import ytdl from "ytdl-core";
import https from "https";
import axios from "axios";
import Crypto from "crypto";
import { basename } from "path";
import { mkdir, rm } from "fs/promises";
import { createWriteStream } from "fs";

import logger from "../utils/logger.js";

export class Downloader {
  #path;
  #fileName;
  constructor() {
    this.#path = `${process.cwd()}/data/Download`;
  }
  #init = async () => {
    await mkdir(`${this.#path}`, { recursive: true });
  };
  download = (url, ext, attemp = 0) => {
    return new Promise(async (resolve, reject) => {
      if (!url) {
        return reject("Url dibutuhkan");
      } else if (!ext) {
        return reject("Extension dibutuhkan");
      }
      await this.#init(ext);
      try {
        https.get(url, (res) => {
          if (res.statusCode === 302 || res.headers.location) {
            if (attemp < 5) {
              return resolve(
                this.download(res.headers.location, ext, attemp + 1)
              );
            } else {
              return reject("Terlalu banyak pengalihan");
            }
          } else if (res.statusCode !== 200) {
            return reject("Gagal mendapatkan url");
          }
          ///
          this.#fileName = `Youtube_@BayuMahadika_${Crypto.randomBytes(
            7
          ).toString("hex")}.${ext}`;
          const fileStream = createWriteStream(
            `${this.#path}/${this.#fileName}`
          );
          const totalSize = parseInt(res.headers["content-length"], 10);
          const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

          const startTime = Date.now();
          let downloadedSize = 0;
          res.on("data", (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize) {
              const percent = `${((downloadedSize / totalSize) * 100).toFixed(
                2
              )}`;
              const elapsed = (Date.now() - startTime) / 1000;
              const downloadedSizeMB = (downloadedSize / (1024 * 1024)).toFixed(
                2
              );
              logger(
                "info",
                "TIKTOK DOWNLOADER",
                `${fileStream.path}\nPath: ${this.#path}\nName: ${basename(
                  fileStream.path
                )}\nDownloading... ${percent}/100%\x20||\x20${downloadedSizeMB}/${totalSizeMB}mb\x20\x20${elapsed.toFixed(
                  2
                )}s`
              );
            }
          });
          res.pipe(fileStream);
          ///
          fileStream.on("error", async (err) => {
            await rm(`${fileStream.path}`, {
              recursive: true,
            });
            return reject(err);
          });
          fileStream.on("finish", () => {
            fileStream.close();
            return resolve({
              filename: basename(fileStream.path),
              filepath: fileStream.path,
            });
          });
        });
      } catch (err) {
        return reject(err);
      }
    });
  };
  tiktok = async (url, format) => {
    try {
      const apiUrl = "https://www.tikwm.com";
      const res = await axios.post(
        `${apiUrl}/api`,
        {},
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua":
              '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
          },
          params: {
            url: url,
            count: 12,
            cursor: 0,
            web: 1,
            hd: 1,
          },
        }
      );
      if (res.data) {
        const { code, data } = res.data;
        if (code >= 0) {
          const { play, music, images } = data;
          if (format === "video") {
            if (!play) {
              return "Video tidak ditemukan";
            }
            try {
              const resTVDownloaded = await this.download(
                `${apiUrl}/${play}`,
                "mp4"
              );
              if (!resTVDownloaded.filepath) {
                return "Video gagal didownload, coba lagi...";
              }
              return resTVDownloaded;
            } catch (err) {
              return err;
            }
          } else if (format === "music") {
            if (!music) {
              return "Music tidak ditemukan";
            }
            try {
              const resTMDownloaded = await this.download(
                `${apiUrl}/${music}`,
                "mp3"
              );
              if (!resTMDownloaded.filepath) {
                return "Music gagal didownload, coba lagi...";
              }
              return resTMDownloaded;
            } catch (err) {
              return err;
            }
          } else if (format === "images") {
            if (!images) {
              return "Images tidak ditemukan";
            }
            try {
              const dataImages = await Promise.all(
                images.map(async (v) => {
                  const dlImage = await this.download(v, "png");
                  return dlImage;
                })
              );
              if (dataImages.length < 0) {
                return "Images gagal didownload, coba lagi...";
              }
              return dataImages;
            } catch (err) {
              return err;
            }
          }
        }
      }
    } catch (err) {
      logger("error", "TIKTOK DOWNLOADER", err);
    }
  };
  youtube = (url, ext) => {
    if (!url) {
      return "Url dibutuhkan";
    } else if (!ext) {
      return "Extension dibutuhkan";
    } else {
      return new Promise((resolve, reject) => {
        try {
          let filter = "videoandaudio";
          if (ext === "music") {
            filter = "audioonly";
          }
          this.#fileName = `Youtube_@BayuMahadika_${Crypto.randomBytes(
            7
          ).toString("hex")}.${ext === "music" ? "mp3" : "mp4"}`;
          const fileStream = createWriteStream(
            `${this.#path}/${this.#fileName}`
          );
          const dlStream = ytdl(url, { filter });

          const startTime = Date.now();
          let totalSize = 0;

          dlStream.on("response", (res) => {
            totalSize = parseInt(res.headers["content-length"], 10);
          });

          let downloadedSize = 0;

          dlStream.on("data", (chunk) => {
            downloadedSize += chunk.length;
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            const percent = `${((downloadedSize / totalSize) * 100).toFixed(
              2
            )}`;
            const elapsed = (Date.now() - startTime) / 1000;
            const downloadedSizeMB = (downloadedSize / (1024 * 1024)).toFixed(
              2
            );
            logger(
              "info",
              "YOUTUBE DOWNLOADER",
              `${fileStream.path}\nPath: ${this.#path}\nName: ${basename(
                fileStream.path
              )}\nDownloading... ${percent}/100%\x20||\x20${downloadedSizeMB}/${totalSizeMB}mb\x20\x20${elapsed.toFixed(
                2
              )}s`
            );
          });

          dlStream.pipe(fileStream);

          dlStream.on("finish", () => {
            resolve({
              filename: basename(fileStream.path),
              filepath: fileStream.path,
            });
          });

          fileStream.on("error", (err) => {
            reject(err);
          });
        } catch (err) {
          logger("error", "YOUTUBE DOWNLOADER", err);
          reject(err);
        }
      });
    }
  };
}
