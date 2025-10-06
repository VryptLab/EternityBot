import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { tmpdir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmp = (name) => path.join(tmpdir(), `${name}_${Date.now()}`);

async function convertFFmpeg(input, output, options = []) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions(options)
      .save(output)
      .on("end", resolve)
      .on("error", reject);
  });
}

export async function toAudio(buffer, ext = "mp4") {
  const input = tmp(`input.${ext}`);
  const output = tmp("output.mp3");
  await fs.promises.writeFile(input, buffer);

  await convertFFmpeg(input, output, ["-vn", "-acodec", "libmp3lame"]);
  const result = await fs.promises.readFile(output);

  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return result;
}

export async function toVideo(buffer, ext = "mp4") {
  const input = tmp(`input.${ext}`);
  const output = tmp("output.mp4");
  await fs.promises.writeFile(input, buffer);

  await convertFFmpeg(input, output, ["-c:v", "libx264", "-preset", "fast"]);
  const result = await fs.promises.readFile(output);

  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return result;
}

export async function webpToPng(buffer) {
  const input = tmp("input.webp");
  const output = tmp("output.png");
  await fs.promises.writeFile(input, buffer);

  await convertFFmpeg(input, output, ["-vcodec", "png"]);
  const result = await fs.promises.readFile(output);

  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return result;
}

export async function imageToWebp(buffer) {
  const input = tmp("input.png");
  const output = tmp("output.webp");
  await fs.promises.writeFile(input, buffer);

  await convertFFmpeg(input, output, ["-vcodec", "libwebp", "-q:v", "80"]);
  const result = await fs.promises.readFile(output);

  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return result;
}

export async function compressImage(buffer, quality = 70) {
  return await sharp(buffer)
    .jpeg({ quality })
    .toBuffer();
}

export async function resizeImage(buffer, width = 512, height = 512) {
  return await sharp(buffer)
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
}

export async function compressVideo(buffer, ext = "mp4", crf = 28) {
  const input = tmp(`input.${ext}`);
  const output = tmp("output.mp4");
  await fs.promises.writeFile(input, buffer);

  await convertFFmpeg(input, output, [
    "-vcodec", "libx264",
    "-crf", crf.toString(),
    "-preset", "veryfast"
  ]);

  const result = await fs.promises.readFile(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return result;
}