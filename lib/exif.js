import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import webp from "node-webpmux";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmp = (name) => path.join(tmpdir(), `${name}_${Date.now()}`);

async function addExif(filePath, { packname = "EternityBot", author = "VryptLab", categories = ["🔥"] } = {}) {
  const img = new webp.Image();
  await img.load(filePath);

  const exifJson = {
    "sticker-pack-id": "vrypt-lab",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "android-app-store-link": "https://play.google.com/store/apps/details?id=com.whatsapp",
    "ios-app-store-link": "https://apps.apple.com/app/whatsapp-messenger/id310633997",
    emojis: categories
  };

  const jsonBuffer = Buffer.from(JSON.stringify(exifJson), "utf8");
  const exifAttr = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
    Buffer.from([jsonBuffer.length + 32, 0x00, 0x00, 0x00]),
    Buffer.from("Exif\x00\x00"),
    jsonBuffer
  ]);

  img.exif = exifAttr;
  const out = tmp("sticker.webp");
  await img.save(out);
  const result = await fs.promises.readFile(out);
  fs.unlinkSync(out);
  return result;
}

export async function writeExifImg(buffer, metadata) {
  const input = tmp("input.webp");
  await fs.promises.writeFile(input, buffer);
  const result = await addExif(input, metadata);
  fs.unlinkSync(input);
  return result;
}

export async function writeExifVid(buffer, metadata) {
  const input = tmp("input.mp4");
  const output = tmp("output.webp");
  await fs.promises.writeFile(input, buffer);

  await new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-i", input,
      "-vcodec", "libwebp",
      "-filter:v", "fps=15,scale=512:512:force_original_aspect_ratio=decrease",
      "-loop", "0",
      "-preset", "picture",
      "-an",
      "-vsync", "0",
      output
    ]);
    ff.on("close", resolve);
    ff.on("error", reject);
  });

  const sticker = await addExif(output, metadata);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return sticker;
}