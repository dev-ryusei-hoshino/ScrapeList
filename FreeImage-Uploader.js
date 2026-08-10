/*
 * Image Uploader
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://freeimage.host
 * License: MIT
 */

import crypto from "crypto";
import fs from "fs";
import FormData from "form-data";
import axios from "axios"; // or fetch

function generateSessionId() {
  return crypto.randomBytes(13).toString("hex");
}

function generateAuthToken(timestamp, sessionId) {
  const salt = "r-sensei";
  const raw = `${timestamp}${salt}${sessionId}`;
  return crypto.createHash("sha1").update(raw).digest("hex");
}

async function uploadImage(filePath) {
  const timestamp = Date.now().toString();
  const sessionId = generateSessionId();
  const authToken = generateAuthToken(timestamp, sessionId);

  const form = new FormData();
  form.append("source", fs.createReadStream(filePath));
  form.append("type", "file");
  form.append("action", "upload");
  form.append("timestamp", timestamp);
  form.append("auth_token", authToken);

  try {
    const response = await axios.post("https://freeimage.host/json", form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `PHPSESSID=${sessionId}`,
        Origin: "https://freeimage.host",
        Referer: "https://freeimage.host/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
        Accept: "application/json",
      },
    });

    const resData = response.data;

    return {
      status: resData.status_code || resData.status || null,
      mess: resData?.success?.message || "-",
      data: {
        filename: resData?.image?.filename || "image",
        size: resData?.image?.size_formatted || null,
        expired: resData?.image?.expiration
          ? resData?.image?.expiration
          : "no expiration",
        original_filename: resData?.image?.original_filename || "image",
        url: resData?.image?.url || null,
        url_viewer_preview: resData?.image?.url_viewer_preview || null,
      },
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      mess: error.message,
      data: null,
    };
  }
}

/* USAGE EXAMPLE:

(async () => {
  const result = await uploadImage("image1.jpg");
  console.log(JSON.stringify(result, null, 2));
})();

*/
