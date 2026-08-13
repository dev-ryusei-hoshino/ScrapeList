/*
 * Anime Search & Anime Info
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://nimegami.id
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://nimegami.id/";
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchPage(url) {
  const res = await axios.get(url, { headers: HEADERS });
  return res.data;
}

function parseArticles(html) {
  const $ = cheerio.load(html);
  const results = [];

  $("article").each((_, el) => {
    const article = $(el);
    const thumbLink = article.find(".thumbnail > a");
    const thumbImg = thumbLink.find("img");
    const titleLink = article.find("h2[itemprop='name'] > a");

    const title = titleLink.text().trim();
    const url = titleLink.attr("href") || thumbLink.attr("href") || "";
    const thumbnail = thumbImg.attr("src") || "";
    const ratingText = article.find(".rating-archive").text().trim();
    const rating = ratingText ? parseFloat(ratingText) : null;
    const epsText = article.find(".eps-archive").text().trim();
    const status = article.find(".term_tag-a > a").text().trim();
    const tags = [];
    article.find(".terms_tag > a").each((_, t) => {
      tags.push($(t).text().trim());
    });

    if (title) {
      results.push({
        title,
        url,
        thumbnail,
        rating,
        episode: epsText,
        status,
        tags,
      });
    }
  });

  return results;
}

function getTotalPages(html) {
  const $ = cheerio.load(html);
  const pageLinks = $(".pagination .page-numbers");
  let maxPage = 1;
  pageLinks.each((_, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/\/page\/(\d+)\//);
    if (match) {
      const pageNum = parseInt(match[1], 10);
      if (pageNum > maxPage) maxPage = pageNum;
    }
  });
  const currentMatch = $(".pagination .current").text().trim();
  if (currentMatch && parseInt(currentMatch) > maxPage) {
    maxPage = parseInt(currentMatch);
  }
  return maxPage;
}

export async function searchAnime(query) {
  if (!query) {
    throw new Error("Query is required");
  }

  const firstUrl = `${BASE_URL}?s=${encodeURIComponent(query)}&post_type=post`;
  const firstHtml = await fetchPage(firstUrl);
  const firstResults = parseArticles(firstHtml);
  const totalPages = getTotalPages(firstHtml);

  const allResults = [...firstResults];
  if (totalPages > 1) {
    const fetches = [];
    for (let page = 2; page <= totalPages; page++) {
      const url = `${BASE_URL}page/${page}/?s=${encodeURIComponent(query)}&post_type=post`;
      fetches.push(fetchPage(url).then(parseArticles));
    }
    const pages = await Promise.all(fetches);
    pages.forEach((pageResults) => allResults.push(...pageResults));
  }

  return {
    success: allResults.length > 0 ? true : false,
    query: query,
    data: allResults,
  };
}

function parseInfoTable($) {
  const info = {};
  $("#Info table tr").each((_, tr) => {
    const $tr = $(tr);
    const label = $tr.find("td.tablex").text().replace(":", "").trim();
    const value = $tr.find("td:not(.tablex)").text().trim();

    if (label.includes("Judul") && !label.includes("Alternatif"))
      info.title = value;
    else if (label.includes("Judul Alternatif")) info.alternativeTitle = value;
    else if (label.includes("Durasi")) info.duration = value;
    else if (label.includes("Rating")) {
      const ratingMatch = value.match(/(\d+\.?\d*)/);
      info.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    } else if (label.includes("Studio")) info.studio = value;
    else if (label.includes("Kategori")) {
      const categories = [];
      $tr
        .find("td.info_a a")
        .each((_, a) => categories.push($(a).text().trim()));
      info.categories = categories;
    } else if (label.includes("Musim")) info.season = value;
    else if (label.includes("Type")) {
      info.type = $tr.find("td a").text().trim();
    } else if (label.includes("Series")) {
      info.series = $tr.find("td a").text().trim();
      info.seriesUrl = $tr.find("td a").attr("href") || "";
    } else if (label.includes("Subtitle")) info.subtitle = value;
  });
  return info;
}

function parseEpisodes($) {
  const episodes = [];
  $(".list_eps_stream li.select-eps").each((_, li) => {
    const $li = $(li);
    const title = $li.text().trim();
    const dataAttr = $li.attr("data") || "";
    let streamingLinks = [];

    try {
      const decoded = decodeURIComponent(escape(atob(dataAttr)));
      const data = JSON.parse(decoded);
      streamingLinks = data.map((item) => ({
        format: item.format,
        urls: item.url || [],
      }));
    } catch {
      streamingLinks = [];
    }

    episodes.push({
      title,
      streamingLinks,
    });
  });
  return episodes;
}

function parseDownloads($) {
  const downloads = {
    batch: [],
    perEpisode: [],
  };

  $(".download_box .batch-dlcuy").each((_, el) => {
    const batchTitle = $(el).find("h4").text().trim();
    const items = [];
    $(el)
      .find("ul > li")
      .each((_, li) => {
        const resolution = $(li).find("strong").text().trim();
        const links = [];
        $(li)
          .find("a")
          .each((_, a) => {
            const href = $(a).attr("href") || "";
            const name = $(a).text().trim();
            if (href) {
              links.push({ name, url: href });
            }
          });
        if (links.length > 0) {
          items.push({ resolution, links });
        }
      });
    if (items.length > 0) {
      downloads.batch.push({ title: batchTitle, items });
    }
  });

  $(".download_box h3.dl_per_ep_title").each((_, el) => {
    const $h3 = $(el);
    let currentEpTitle = "";
    let currentItems = [];

    $h3.nextUntil("h3.dl_per_ep_title").each((_, sibling) => {
      const $sibling = $(sibling);
      if ($sibling.is("h4")) {
        if (currentEpTitle && currentItems.length > 0) {
          downloads.perEpisode.push({
            title: currentEpTitle,
            items: currentItems,
          });
        }
        currentEpTitle = $sibling.text().trim();
        currentItems = [];
      } else if ($sibling.is("ul")) {
        $sibling.find("li").each((_, li) => {
          const resolution = $(li).find("strong").text().trim();
          const links = [];
          $(li)
            .find("a")
            .each((_, a) => {
              const href = $(a).attr("href") || "";
              const name = $(a).text().trim();
              if (href) {
                links.push({ name, url: href });
              }
            });
          if (links.length > 0) {
            currentItems.push({ resolution, links });
          }
        });
      }
    });

    if (currentEpTitle && currentItems.length > 0) {
      downloads.perEpisode.push({
        title: currentEpTitle,
        items: currentItems,
      });
    }
  });

  return downloads;
}

function parsePoster($) {
  const scriptMatch = $.html().match(/const poster = "([^"]+)";/);
  if (scriptMatch) {
    try {
      return decodeURIComponent(escape(atob(scriptMatch[1])));
    } catch {
      return null;
    }
  }
  return null;
}

export async function animeInfo(url) {
  if (!url) {
    throw new Error("URL is required");
  }

  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const title =
    $("h1.title").text().trim() || $("h2.subheading h2").text().trim();
  const thumbnail = $(".thumbnail-a img").attr("src") || "";
  const poster = parsePoster($);
  const info = parseInfoTable($);
  const sinopsis = $("#Sinopsis")
    .clone()
    .children("h5")
    .remove()
    .end()
    .text()
    .trim();
  const episodes = parseEpisodes($);
  const downloads = parseDownloads($);
  const author = $(".info span[itemprop='name']").text().trim() || "";
  const datePublished =
    $("meta[itemprop='datePublished']").attr("content") || "";

  const keywords = [];
  $(".keyword span[itemprop='keywords']").each((_, el) => {
    const text = $(el).text().trim();
    if (text) keywords.push(text);
  });

  const result = {
    url,
    title,
    thumbnail,
    poster,
    author,
    datePublished,
    info,
    sinopsis,
    episodes,
    downloads,
    keywords,
  };

  return {
    success: true,
    data: result,
  };
}

/* USAGE EXAMPLE: */

// const search = await searchAnime("yosuga no sora");
// console.log(JSON.stringify(search, null, 2));

// const info = await animeInfo("https://nimegami.id/yosuga-no-sora-sub-indo/");
// console.log(JSON.stringify(info, null, 2));
