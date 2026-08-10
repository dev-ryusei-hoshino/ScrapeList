/*
 * [UPDATED] SSSTikDownload ( Slider Support )
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://ssstik.io
 * License: MIT
 */

import * as cheerio from "cheerio";

export async function ssstik(url) {
  const body = new URLSearchParams({
    id: url,
    locale: "en",
    tt: "UmFEWVUy",
    debug: "ab=0&loc=ID",
  });

  const res = await fetch("https://ssstik.io/abc?url=dl", {
    method: "POST",
    headers: {
      origin: "https://ssstik.io",
      referer: "https://ssstik.io/",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
    },
    body,
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const isPhoto =
    $(".splide__slide").length > 0 || $("#avatar_and_text").length > 0;

  const isVideo = $("#avatarAndTextUsual").length > 0;

  const info = isPhoto ? $("#avatar_and_text") : $("#avatarAndTextUsual");

  const author = info.find("h2").first().text().trim() || null;

  const profile =
    info.find(".result_author").attr("src") ||
    $(".result_author").first().attr("src") ||
    null;

  const caption =
    info
      .find(".maintext")
      .text()
      .replace(/\u00a0/g, " ")
      .trim() || null;

  const tags = caption?.match(/#[\p{L}\p{N}_]+/gu) || [];

  const stats = $("#trending-actions > div")
    .map((_, el) => $(el).children("div").last().text().trim())
    .get();

  const downloads = [];

  $(".download_link").each((_, el) => {
    const e = $(el);

    downloads.push({
      text: e.text().replace(/\s+/g, " ").trim(),
      href: e.attr("href") || null,
      classes: (e.attr("class") || "").split(/\s+/).filter(Boolean),
      id: e.attr("id") || null,
      directUrl: e.attr("data-directurl") || e.attr("hx-post") || null,
    });
  });

  const photos = $(".splide__slide")
    .map((_, el) => ({
      preview:
        $(el).find("img").attr("data-splide-lazy") ||
        $(el).find("img").attr("src") ||
        null,
      download: $(el).find("a.download_link").attr("href") || null,
    }))
    .get();

  const noWatermark = $(".without_watermark[href]").attr("href") || null;

  const hd =
    $("#hd_download").attr("data-directurl") ||
    $("#hd_download").attr("hx-post") ||
    null;

  const mp3 = $(".music").attr("href") || null;

  const downloadVideo =
    $("#slides_generate").attr("hx-post") ||
    $(".slides_video").attr("hx-post") ||
    null;

  const cover =
    $(".result_overlay")
      .attr("style")
      ?.match(/url\((.*?)\)/)?.[1] ||
    html.match(/background-image:\s*url\((.*?)\)/)?.[1] ||
    null;

  const tt = $('input[name="tt"]').attr("value") || null;

  const slidesData = $('input[name="slides_data"]').attr("value") || null;

  if (isPhoto) {
    return {
      type: "photo",
      author,
      profile,
      caption,
      tags,
      likes: stats[0] || null,
      comments: stats[1] || null,
      shares: stats[2] || null,
      cover,
      mp3,
      photos,
    };
  }

  return {
    type: "video",
    author,
    profile,
    caption,
    tags,
    likes: stats[0] || null,
    comments: stats[1] || null,
    shares: stats[2] || null,
    cover,
    noWatermark,
    mp3,
  };
}

/* EXAMPLE USAGE:

import { ssstik } from "./ssstik.js";

const result = await ssstik("https://vt.tiktok.com/ZS4y5vc3F/"); // Vid
const result = await ssstik("https://vt.tiktok.com/ZS4geUA7K"); // Photo Slide

console.dir(result, {
  depth: null,
});

*/
