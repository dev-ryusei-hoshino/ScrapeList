/*
 * Catbox.moe Uploader
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://catbox.moe
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const UPLOAD_URL = "https://catbox.moe/user/api.php";
const USERHASH = "";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0";

function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".txt": "text/plain",
    ".js": "application/javascript",
    ".json": "application/json",
    ".html": "text/html",
    ".css": "text/css",
  };
  return map[ext] || "application/octet-stream";
}

async function getFileInfo(filePath, uploadedUrl) {
  const stat = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const fileSize = stat.size;
  const fileType = getMimeType(filePath);
  const fileFormat = path.extname(filePath).replace(".", "").toLowerCase();
  const uploadTime = new Date().toISOString();

  let remoteSize = null;
  let remoteType = null;

  if (uploadedUrl) {
    try {
      const head = await axios.head(uploadedUrl, {
        headers: { "User-Agent": UA },
        timeout: 15000,
        maxRedirects: 5,
      });
      remoteSize =
        head.headers["content-length"] !== undefined
          ? parseInt(head.headers["content-length"], 10)
          : null;
      remoteType = head.headers["content-type"] || null;
    } catch {
      // ignore head request failure
    }
  }

  return {
    fileName,
    fileSize,
    fileSizeFormatted: formatSize(fileSize),
    fileType,
    fileFormat,
    uploadTime,
    remoteSize,
    remoteSizeFormatted: remoteSize !== null ? formatSize(remoteSize) : null,
    remoteType,
  };
}

async function uploadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      mess: "file not found: " + filePath,
    };
  }

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath));
  if (USERHASH) {
    form.append("userhash", USERHASH);
  }

  try {
    const startTime = Date.now();
    const { data } = await axios.post(UPLOAD_URL, form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent": UA,
        Referer: "https://catbox.moe/",
      },
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const elapsed = Date.now() - startTime;
    const url = (typeof data === "string" ? data.trim() : "").split("\n")[0];

    if (!url || !url.startsWith("http")) {
      return {
        success: false,
        mess: "unexpected response",
        raw: data,
      };
    }

    const fileInfo = await getFileInfo(filePath, url);

    return {
      success: true,
      url,
      elapsedMs: elapsed,
      elapsedFormatted: elapsed + "ms",
      file: fileInfo,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      mess: err.message,
      status: err.response?.status || null,
      raw: err.response?.data || null,
    };
  }
}

export { uploadFile };

/*
 * EXAMPLE USAGE
 *
 * const res = await uploadFile("path/to/file.png");
 * console.log(JSON.stringify(res, null, 2));
 *
 */

const res = await uploadFile("./image1.jpg");
console.log(JSON.stringify(res, null, 2));
