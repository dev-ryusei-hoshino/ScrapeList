/*
 * Bestfile Uploader ( with auto-delete )
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://bestfile.io
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const PAGE_BASE = "https://bestfile.io";

const COMMON_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  "Cache-Control": "no-cache",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
};

async function getPage(url, options = {}) {
  const res = await axios.get(url, {
    headers: { ...COMMON_HEADERS, ...options.headers },
    maxRedirects: 5,
    timeout: 30000,
  });
  return res;
}

async function getCsrfAndCookies(pageUrl) {
  const pageRes = await getPage(pageUrl);

  const csrfMatch =
    pageRes.data.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/i) ||
    pageRes.data.match(/csrf-token["\s]+content="([^"]+)"/i);

  const setCookies = pageRes.headers["set-cookie"] || [];
  const cookieParts = setCookies.map((c) => c.split(";")[0]).join("; ");

  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  if (!csrfToken) {
    throw new Error("CSRF token not found");
  }

  return { csrfToken, cookieParts };
}

const AUTO_DELETE_OPTIONS = [
  "After 5 minutes",
  "After 15 minutes",
  "After 30 minutes",
  "After 1 hour",
  "After 3 hours",
  "After 6 hours",
  "After 12 hours",
  "After 1 day",
  "After 2 days",
  "After 3 days",
  "After 4 days",
  "After 5 days",
  "After 6 days",
  "After 1 week",
  "After 2 weeks",
  "After 3 weeks",
];

function validateAutoDelete(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 15
  ) {
    return String(value);
  }
  throw new Error(
    `autoDelete must be a number between 0 and 15. Got: ${value}. ` +
      `Options: ${AUTO_DELETE_OPTIONS.map((label, index) => `${index}=${label}`).join(", ")}`,
  );
}

async function uploadFile(filePath, options = {}) {
  try {
    const { csrfToken, cookieParts } = await getCsrfAndCookies(
      PAGE_BASE + "/en",
    );

    const fileStats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const autoDeleteValue = validateAutoDelete(options.autoDelete);

    const form = new FormData();
    form.append("dzuuid", "8b2fd1b6-7f2d-45c2-bf2c-cac8bbee16c5");
    form.append("dzchunkindex", "0");
    form.append("dztotalfilesize", String(fileStats.size));
    form.append("dzchunksize", "104857600");
    form.append("dztotalchunkcount", "1");
    form.append("dzchunkbyteoffset", "0");
    form.append("size", String(fileStats.size));
    form.append("password", options.password || "");
    form.append("upload_auto_delete", autoDeleteValue);
    form.append("file", fileBuffer, {
      filename: fileName,
      contentType: "application/octet-stream",
    });

    const uploadRes = await axios.post(PAGE_BASE + "/upload", form, {
      headers: {
        ...form.getHeaders(),
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/plain, */*",
        Origin: PAGE_BASE,
        Referer: PAGE_BASE + "/en",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Cookie: cookieParts,
      },
      maxRedirects: 5,
      timeout: 30000,
    });

    const data = uploadRes.data;
    if (data?.type === "success" && data.download_link) {
      return {
        success: true,
        download_id: data.download_id,
        download_link: data.download_link,
        preview_link: data.preview_link || null,
        file_name: fileName,
        file_size: fileStats.size,
        auto_delete: AUTO_DELETE_OPTIONS[Number(autoDeleteValue)],
      };
    }

    return {
      success: false,
      message: data?.error || data?.message || "Upload failed",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to upload file",
    };
  }
}

export async function bestFileUpload(filePath, options = {}) {
  return await uploadFile(filePath, options);
}

export default { bestFileUpload };

/* 

Usage Example:

import { bestFileUpload } from "./bestfile.js";

const res = await bestFileUpload("./audio_1.mp3", {
  autoDelete: 7,
});

console.log(JSON.stringify(res, null, 2));



Auto-Delete List:
0  = 5 minutes
1  = 15 minutes
2  = 30 minutes
3  = 1 hour
4  = 3 hours
5  = 6 hours
6  = 12 hours
7  = 1 day
8  = 2 days
9  = 3 days
10 = 4 days
11 = 5 days
12 = 6 days
13 = 1 week
14 = 2 weeks
15 = 3 weeks

*/
