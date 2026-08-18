/*
 * AnimeHeaven Scrape
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://animeheaven.me
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note:
 * > DOSA DITANGGUNG MASING - MASING! JANGAN SALAHIN ADMIN ;)
 * > Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://animeheaven.me";

async function animeHeaven() {
  try {
    const { data } = await axios.get(BASE, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".chart").each((_, el) => {
      const $el = $(el);
      const link = $el.find(".chartimg a").first();
      const img = link.find("img.coverimg");
      const epm = link.find(".chartepm");
      const title = $el.find(".charttitle a").text().trim();
      const jp = $el.find(".charttitlejp").text().trim();
      const timer = $el.find(".charttimer").text().trim();

      if (title) {
        results.push({
          title,
          japaneseTitle: jp || null,
          episode: epm.text().trim() || null,
          cover: img.attr("src")
            ? BASE + "/" + img.attr("src").replace(/^\//, "")
            : null,
          url: link.attr("href")
            ? BASE + "/" + link.attr("href").replace(/^\//, "")
            : null,
          timer: timer || null,
        });
      }
    });

    return results;
  } catch (err) {
    return {
      success: false,
      mess: err.message,
    };
  }
}

async function animeHeavenSearch(query) {
  try {
    const { data } = await axios.get(BASE + "/search.php", {
      params: { s: query },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".similarimg .p1").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const img = link.find("img.coverimg");
      const name = $el.find(".similarname a").text().trim();

      if (name) {
        results.push({
          title: name,
          cover: img.attr("src")
            ? BASE + "/" + img.attr("src").replace(/^\//, "")
            : null,
          url: link.attr("href")
            ? BASE + "/" + link.attr("href").replace(/^\//, "")
            : null,
        });
      }
    });

    if (results.length === 0) {
      return {
        success: false,
        mess: `No results found for query: "${query}"`,
      };
    }

    return results;
  } catch (err) {
    return {
      success: false,
      mess: err.message,
    };
  }
}

async function animeHeavenInfo(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);
    const info = {};

    info.title = $(".infotitle").first().text().trim();
    info.japaneseTitle = $(".infotitlejp").first().text().trim();
    info.description = $(".infodes").first().text().trim();

    const tags = [];
    $(".infotags .boxitem").each((_i, el) => {
      tags.push($(el).text().trim());
    });
    info.tags = tags;

    const yearText = $(".infoyear").text().trim();
    const epMatch = yearText.match(/Episodes:\s*(\d+)/);
    const yearMatch = yearText.match(/Year:\s*(\d+)/);
    const scoreMatch = yearText.match(/Score:\s*([\d.]+)/);
    info.episodes = epMatch ? epMatch[1] : null;
    info.year = yearMatch ? yearMatch[1] : null;
    info.score = scoreMatch ? scoreMatch[1] : null;

    info.cover = $(".posterimg").attr("src") || null;

    const episodes = [];
    $(".linetitle2 a").each((_i, el) => {
      const $el = $(el);
      const gateId = $el.attr("id");
      const epNum = $el.find(".watch2").first().text().trim();
      const timeText = $el.find(".watch1").last().text().trim();
      episodes.push({
        episode: epNum,
        timeAgo: timeText,
        gateId,
      });
    });
    info.episodesList = episodes;

    return info;
  } catch (err) {
    return {
      success: false,
      mess: err.message,
    };
  }
}

export { animeHeaven, animeHeavenSearch, animeHeavenInfo };

// EXAMPLE

/* (async () => {
  // const home = await animeHeaven();
  // console.log(JSON.stringify(home, null, 2));

  // const search = await animeHeavenSearch("Yosuga No Sora");
  // console.log(JSON.stringify(search, null, 2));

  // const detail = await animeHeavenInfo(
  //   "https://animeheaven.me/anime.php?vsexl",
  // );
  // console.log(JSON.stringify(detail, null, 2));
})(); */
