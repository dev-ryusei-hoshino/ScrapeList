/*
 * Text To Speech
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://translate.google.com/
 * License: MIT
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

export async function googleTTS(text, lang = "id") {
  const url =
    "https://translate.google.com/translate_tts?ie=UTF-8&q=" +
    encodeURIComponent(text) +
    "&tl=" +
    encodeURIComponent(lang) +
    "&client=tw-ob";

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
      referer: "https://translate.google.com/",
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(
      "Google TTS request failed: " + res.status + " " + res.statusText,
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "audio/mpeg";

  return {
    success: true,
    text,
    lang,
    download: url,
    buffer,
    contentType,
    size: buffer.length,
  };
}

/* EXAMPLE USAGE:

import { googleTTS } from "./11.js";

const result = await googleTTS("I've been so fucking rude.. When I say I always win! But I know I lose.", "en"); // English
const result = await googleTTS("Halo dunia!", "id"); // Indonesian

console.log(result);


// Simpan ke file | Write to file
import { writeFileSync } from "fs";
writeFileSync("output.mp3", result.buffer);

*/
