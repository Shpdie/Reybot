import { Downloader } from "./lib/Downloader.js";

const downloader = new Downloader();

try {
  const url = "https://youtu.be/N446pcOvpQE?si=hjpd_oq5vGWLrsEz";
  const test = async () => {
    const res = await downloader.youtube(url, "video");
    console.log(res);
  };
  await test();
} catch (err) {
  console.log(err);
}
