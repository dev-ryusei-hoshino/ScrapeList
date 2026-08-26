/*
 * Tiktok Downloader ( Slider Support )
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://aksa-downloader.vercel.app/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";

async function scrape(url) {
  try {
    const res = await axios.get(
      `https://api.zellrayy.com/download/tiktok?url=${encodeURIComponent(url)}`,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
          Referer: "https://api.zellrayy.com/",
        },
        validateStatus: () => true,
      },
    );

    if (res.status < 200 || res.status >= 300) {
      return {
        success: res?.data?.status,
        status: res.status,
        data: res.data || null,
      };
    }

    return {
      success: res?.data?.status,
      data: res?.data?.result || null,
    };
  } catch (error) {
    return {
      success: res?.data?.status,
      status: error.response?.status || null,
      data: error.response?.data || null,
      error: error.message,
    };
  }
}

/* EXAMPLE USAGE:
 * (async () => {
 *   const res = await scrape("https://vt.tiktok.com/ZS4geUA7K"); // video
 *   const res = await scrape("https://vt.tiktok.com/ZS4y5vc3F"); // slider
 *   console.log(res);
 * })();
 */
