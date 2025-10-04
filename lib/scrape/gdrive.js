import axios from "axios";
import * as cheerio from "cheerio";

async function gdrive(url) {
  try {
    if (!/drive\.google\.com\/file\/d\//gi.test(url)) {
      throw new Error("Invalid URL");
    }

    const html = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }).then((v) => v.data);

    const $ = cheerio.load(html);
    const id = url.split("/")[5];
    const download = `https://drive.usercontent.google.com/uc?id=${id}&export=download`;

    const fileName =
      $('meta[property="og:title"]').attr("content") ||
      $("head title").text().split("-")[0].trim() ||
      "unknown";

    const description = $('meta[property="og:description"]').attr("content") || "";
    const mimeMatch = description.match(/type: (.+?),/i);
    const mimeType = mimeMatch ? mimeMatch[1] : "unknown";

    const sizeMatch = description.match(/size: ([^,]+)/i);
    const sizeText = sizeMatch ? sizeMatch[1] : null;

    return {
      id,
      name: fileName,
      mimeType,
      size: sizeText,
      link: url,
      download,
    };
  } catch (e) {
    console.error("Parser Error:", e.message);
    throw new Error("Failed to parse Google Drive page");
  }
}

export default gdrive;