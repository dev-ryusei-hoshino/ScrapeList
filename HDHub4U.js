/*
 * HDHub4u Scrape
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://new1.hdhub4u.af
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://new1.hdhub4u.af";
const SEARCH_API =
  "https://search.pingora.fyi/collections/post/documents/search";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

const htmlHeaders = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const apiHeaders = {
  "User-Agent": UA,
  Accept: "application/json",
  Origin: BASE,
  Referer: BASE + "/",
  "X-TYPESENSE-CACHE-CONFIG": "none",
  "X-TYPESENSE-DATA": "search",
};

const INFO_LABELS = [
  "iMDB Rating:",
  "Genre:",
  "Stars:",
  "Director:",
  "Language:",
  "Quality:",
];

function toAbsolute(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : BASE + url;
}

function resolveHomepageUrl(page) {
  const p = parseInt(page, 10) || 1;
  if (p <= 1) return BASE + "/";
  return BASE + "/page/" + p + "/";
}

async function homePage(page = 1) {
  try {
    const url = resolveHomepageUrl(page);
    const { data } = await axios.get(url, {
      headers: htmlHeaders,
      timeout: 30000,
    });
    const $ = cheerio.load(data);

    const movies = [];
    $("ul.recent-movies li.thumb").each((_, el) => {
      const $el = $(el);
      const title = $el.find("figcaption a p").first().text().trim();
      const url = $el.find("figure a").first().attr("href");
      const image = $el.find("figure img").first().attr("src");

      if (title && url) {
        movies.push({
          title,
          url: toAbsolute(url),
          image: image || null,
        });
      }
    });

    const currentPage =
      parseInt(
        $("span.page-numbers.current").first().text().trim() || "1",
        10,
      ) || 1;

    let totalPages = currentPage;
    $("a.page-numbers")
      .not(".next")
      .not(".prev")
      .each((_, el) => {
        const num = parseInt($(el).text().replace(/,/g, ""), 10);
        if (!isNaN(num) && num > totalPages) totalPages = num;
      });

    const nextHref = $("a.next.page-numbers").first().attr("href");

    return {
      success: true,
      source: BASE,
      url,
      currentPage,
      totalPages,
      hasNextPage: !!nextHref,
      nextPageUrl: nextHref ? toAbsolute(nextHref) : null,
      sectionTitle:
        $("h2.category-name span.material-text").first().text().trim() || null,
      count: movies.length,
      movies,
    };
  } catch (err) {
    return {
      success: false,
      mess: err.message,
    };
  }
}

async function searchMovie(query, page = 1) {
  if (!query || !query.trim()) {
    return {
      success: false,
      mess: "please input a search query",
    };
  }

  try {
    const { data } = await axios.get(SEARCH_API, {
      params: {
        q: query.trim(),
        query_by: "post_title,category,stars,director,imdb_id",
        query_by_weights: "4,2,2,2,4",
        sort_by: "sort_by_date:desc",
        limit: 15,
        page: parseInt(page, 10) || 1,
      },
      headers: apiHeaders,
      timeout: 30000,
    });

    const results = (data.hits || []).map((hit) => {
      const doc = hit.document || {};
      return {
        title: doc.post_title || null,
        url: toAbsolute(doc.permalink || ""),
        image: doc.post_thumbnail || null,
        id: doc.id || null,
        imdb_id: doc.imdb_id || null,
        categories: doc.category || [],
        stars: doc.stars || [],
        director: Array.isArray(doc.director)
          ? doc.director[0]
          : doc.director || null,
        date: doc.post_date || null,
      };
    });

    const found = data.found || 0;
    const totalPages = data.out_of || Math.max(Math.ceil(found / 15), 1) || 1;

    return {
      success: true,
      source: SEARCH_API,
      query: query.trim(),
      page: parseInt(page, 10) || 1,
      totalResults: found,
      totalPages,
      count: results.length,
      results,
    };
  } catch (err) {
    return {
      success: false,
      mess: err.message,
      status: err.response?.status || null,
    };
  }
}

async function detailMovie(url) {
  if (!url) {
    return {
      success: false,
      mess: "please input an url",
    };
  }

  try {
    const targetUrl = toAbsolute(url);
    const { data } = await axios.get(targetUrl, {
      headers: htmlHeaders,
      timeout: 30000,
    });
    const $ = cheerio.load(data);

    const info = {
      success: true,
      source: BASE,
      url: targetUrl,
    };

    info.title =
      $("h1.page-title span.material-text").first().text().trim() || null;

    info.date =
      $("div.page-meta span em.material-text b").first().text().trim() || null;

    const categories = [];
    $("div.page-meta a em.material-text").each((_, el) => {
      const name = $(el).text().trim();
      const catUrl = $(el).closest("a").attr("href");
      if (name && catUrl) {
        categories.push({ name, url: toAbsolute(catUrl) });
      }
    });
    info.categories = categories;

    info.image =
      $("main.page-body img.aligncenter").first().attr("src") || null;

    const meta = {};
    for (const label of INFO_LABELS) {
      const $strong = $("main.page-body strong")
        .filter((_, el) => $(el).text().trim() === label)
        .first();
      if ($strong.length) {
        const value = $strong.parent().text().replace(label, "").trim();
        const key = label.replace(/:$/, "").replace(/\s+/g, "");
        meta[key] = value;
      }
    }

    info.imdbRating = meta.iMDBRating || null;
    info.imdbUrl =
      $("main.page-body a[href*='imdb.com']").first().attr("href") || null;
    info.genre = meta.Genre
      ? meta.Genre.split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    info.stars = meta.Stars
      ? meta.Stars.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    info.director = meta.Director || null;
    info.language = meta.Language || null;
    info.quality = meta.Quality || null;

    const screenshots = [];
    const downloadLinks = [];
    const watchLinks = [];

    $("main.page-body h3 a, main.page-body h4 a").each((_, el) => {
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr("href");
      if (!href) return;

      const $img = $a.find("img").first();

      if (!text && $img.length) {
        screenshots.push({ url: href, image: $img.attr("src") || null });
        return;
      }

      if (/watch|player/i.test(text)) {
        watchLinks.push({ text, url: toAbsolute(href) });
        return;
      }

      downloadLinks.push({ text, url: toAbsolute(href) });
    });

    info.screenshots = screenshots;
    info.downloadLinks = downloadLinks;
    info.watchLinks = watchLinks;

    const $span = $("div.kno-rdesc span")
      .filter((_, el) => $(el).find("strong").length)
      .first();
    if ($span.length) {
      const $inner = $span.parent();
      const strongText = $inner.find("strong").first().text();
      const $clone = $inner.clone();
      $clone.find("h2").remove();
      $clone.find("p").remove();
      $clone.find("strong").remove();
      let storyline = $clone.text().trim();
      if (strongText) storyline = storyline.replace(strongText, "").trim();
      info.storyline = storyline || null;
    } else {
      info.storyline = null;
    }

    return info;
  } catch (err) {
    return {
      success: false,
      mess: err.message,
      status: err.response?.status || null,
    };
  }
}

export { homePage, searchMovie, detailMovie };

/* EXAMPLE USAGE

const home = await homePage(1);
console.log(JSON.stringify(home, null, 2));

const search = await searchMovie("Lenin", 1);
console.log(JSON.stringify(search, null, 2));

const detail = await detailMovie("https://new1.hdhub4u.af/lenin-2026-hindi-hq-dubbed-webrip-full-movie/");
console.log(JSON.stringify(detail, null, 2));
*/
