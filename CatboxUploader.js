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
import { Readable } from "stream";

const UPLOAD_URL = "https://catbox.moe/user/api.php";
const USERHASH = "";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0";

function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getMimeType(filePathOrName) {
  const ext = path.extname(filePathOrName || "").toLowerCase();

  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",

    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",

    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",

    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",

    ".txt": "text/plain",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".cjs": "application/javascript",
    ".json": "application/json",
    ".html": "text/html",
    ".css": "text/css",
    ".xml": "application/xml",

    ".apk": "application/vnd.android.package-archive",
    ".exe": "application/vnd.microsoft.portable-executable",
  };

  return map[ext] || "application/octet-stream";
}

function getFileName(input, filename, mimeType) {
  if (filename) {
    return path.basename(filename);
  }

  if (typeof input === "string") {
    return path.basename(input);
  }

  const extMap = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
  };

  const ext = extMap[mimeType] || ".bin";

  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
}

function getFileFormat(filename) {
  return path.extname(filename).replace(".", "").toLowerCase();
}

function isReadableStream(input) {
  return (
    input instanceof Readable || (input && typeof input.pipe === "function")
  );
}

function getBufferFromInput(input) {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof Uint8Array) {
    return Buffer.from(input);
  }

  return null;
}

async function prepareUpload(input, filename) {
  const fileName = getFileName(input, filename);
  const fileType = getMimeType(fileName);

  if (typeof input === "string") {
    if (!fs.existsSync(input)) {
      throw new Error(`file not found: ${input}`);
    }

    const stat = fs.statSync(input);

    return {
      value: fs.createReadStream(input),
      fileName,
      fileSize: stat.size,
      fileType,
    };
  }

  const buffer = getBufferFromInput(input);

  if (buffer) {
    return {
      value: buffer,
      fileName,
      fileSize: buffer.length,
      fileType,
    };
  }

  if (isReadableStream(input)) {
    return {
      value: input,
      fileName,
      fileSize: null,
      fileType,
    };
  }

  if (input instanceof Blob) {
    return {
      value: Buffer.from(await input.arrayBuffer()),
      fileName,
      fileSize: input.size,
      fileType: input.type || fileType,
    };
  }

  if (input && typeof input === "object") {
    if (input.data !== undefined) {
      return prepareUpload(input.data, input.filename || filename);
    }

    if (input.buffer !== undefined) {
      return prepareUpload(input.buffer, input.filename || filename);
    }

    if (input.body !== undefined) {
      return prepareUpload(input.body, input.filename || filename);
    }
  }

  throw new TypeError(
    "Unsupported input. Use file path, Buffer, Uint8Array, Blob, ReadableStream, or { data, filename }.",
  );
}

async function getFileInfo(fileName, fileSize, uploadedUrl) {
  const fileType = getMimeType(fileName);
  const fileFormat = getFileFormat(fileName);
  const uploadTime = new Date().toISOString();

  let remoteSize = null;
  let remoteType = null;

  if (uploadedUrl) {
    try {
      const head = await axios.head(uploadedUrl, {
        headers: {
          "User-Agent": UA,
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      remoteSize =
        head.headers["content-length"] !== undefined
          ? parseInt(head.headers["content-length"], 10)
          : null;

      remoteType = head.headers["content-type"] || null;
    } catch {}
  }

  return {
    fileName,
    fileSize,
    fileSizeFormatted: fileSize !== null ? formatSize(fileSize) : null,
    fileType,
    fileFormat,
    uploadTime,
    remoteSize,
    remoteSizeFormatted: remoteSize !== null ? formatSize(remoteSize) : null,
    remoteType,
  };
}

async function uploadFile(input, filename) {
  try {
    const upload = await prepareUpload(input, filename);

    const form = new FormData();

    form.append("reqtype", "fileupload");

    form.append("fileToUpload", upload.value, {
      filename: upload.fileName,
      contentType: upload.fileType,
      ...(upload.fileSize !== null
        ? {
            knownLength: upload.fileSize,
          }
        : {}),
    });

    if (USERHASH) {
      form.append("userhash", USERHASH);
    }

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

    const fileInfo = await getFileInfo(upload.fileName, upload.fileSize, url);

    return {
      success: true,
      url,
      elapsedMs: elapsed,
      elapsedFormatted: `${elapsed}ms`,
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
 * File path
 *
 * const res = await uploadFile("./image.png");
 *
 *
 * Buffer
 *
 * const buffer = fs.readFileSync("./image.png");
 * const res = await uploadFile(buffer, "image.png");
 *
 *
 * Uint8Array
 *
 * const data = new Uint8Array(...);
 * const res = await uploadFile(data, "file.bin");
 *
 *
 * Object
 *
 * const res = await uploadFile({
 *   data: buffer,
 *   filename: "image.png"
 * });
 *
 *
 * Stream
 *
 * const stream = fs.createReadStream("./image.png");
 * const res = await uploadFile(stream, "image.png");
 *
 *
 * Blob
 *
 * const blob = new Blob([buffer], {
 *   type: "image/png"
 * });
 *
 * const res = await uploadFile(blob, "image.png");
 *
 *
 * Result
 *
 * console.log(JSON.stringify(res, null, 2));
 */
