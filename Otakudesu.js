/*
 * Otaku Desu
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://otakudesu.blog/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import * as cheerio from "cheerio";

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function scrapeSection($, $ul, includeRating = false) {
  const items = [];
  $ul.find("> li").each((_, li) => {
    const $li = $(li);
    const $thumb = $li.find("div.thumb").first();
    const $a = $thumb.find("a").first();
    const $h2 = $thumb.find("h2").first();
    const title = $h2.text().trim() || $a.attr("title") || $a.text().trim();
    const url = $a.attr("href") || "";
    const thumb = $thumb.find("img").attr("src") || "";

    const epRaw = $li.find("div.epz").text().trim();
    const episode = epRaw
      ? epRaw.replace(/Episode\s*/i, "").trim() || null
      : null;

    const tipeRaw = $li.find("div.epztipe").text().trim();
    let day = null;
    let rating = null;
    if (includeRating) {
      const m = tipeRaw.match(/(\d+(?:\.\d+)?)/);
      if (m) rating = parseFloat(m[1]);
    } else {
      day = tipeRaw.replace(/^.*?fa-star.*?/i, "").trim() || tipeRaw || null;
      if (day && /^[\d.]+$/.test(day)) day = null;
    }

    const date = $li.find("div.newnime").text().trim() || null;

    items.push({
      title,
      url,
      thumb,
      episode,
      day,
      date,
      rating: includeRating ? rating : null,
    });
  });
  return items;
}

async function home() {
  try {
    const html = await fetchHtml("https://otakudesu.blog/");
    const $ = cheerio.load(html);

    const $ongoing = $("div.rseries")
      .filter((_, el) =>
        $(el)
          .find("#rvod h1")
          .first()
          .text()
          .toLowerCase()
          .includes("on-going"),
      )
      .find("div.venz > ul")
      .first();
    const $complete = $("div.rseries")
      .filter((_, el) =>
        $(el)
          .find("#rvod h1")
          .first()
          .text()
          .toLowerCase()
          .includes("complete"),
      )
      .find("div.venz > ul")
      .first();

    const ongoing = scrapeSection($, $ongoing, false);
    const complete = scrapeSection($, $complete, true);

    return {
      success: true,
      ongoing,
      complete,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function search(query) {
  try {
    const url = `https://otakudesu.blog/?s=${encodeURIComponent(query)}&post_type=anime`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const titleText = $("div.rvad h1").first().text().trim() || "";
    const totalText = titleText.match(/Max\.\s*hanya\s*sampai\s*(\d+)/i);
    const maxResults = totalText ? parseInt(totalText[1], 10) : 12;

    const items = [];
    $("ul.chivsrc > li").each((_, li) => {
      const $li = $(li);
      const $a = $li.find("h2 > a").first();
      const title = $a.text().trim();
      const url = $a.attr("href") || "";
      if (!title && !url) return;

      const $img = $li.find("img").first();
      const thumb = $img.attr("src") || "";
      const alt = $img.attr("alt") || "";
      const type = /\/episode\/[^/]+\/?$/i.test(url) ? "episode" : "anime";

      const genres = [];
      $li.find("div.set").each((_, set) => {
        const $set = $(set);
        const text = $set.text().trim();
        if (text.startsWith("Genres")) {
          $set.find("a").each((_, a) => {
            const $a = $(a);
            const name = $a.text().trim();
            const href = $a.attr("href") || "";
            if (!name) return;
            const absolute = href.startsWith("http")
              ? href
              : `https://otakudesu.blog${href}`;
            const slug =
              absolute.replace(
                /https?:\/\/otakudesu\.blog\/genres\/|\/$/g,
                "",
              ) || null;
            genres.push({ name, slug, url: absolute });
          });
        }
      });

      let status = null;
      let rating = null;
      $li.find("div.set").each((_, set) => {
        const $set = $(set);
        const text = $set.text().trim();
        if (text.startsWith("Status")) {
          status = text.replace(/^Status\s*:\s*/i, "").trim() || null;
        }
        if (text.startsWith("Rating")) {
          const m = text.match(/(\d+(?:\.\d+)?)/);
          rating = m ? parseFloat(m[1]) : null;
        }
      });

      items.push({
        title,
        url,
        type,
        thumb,
        alt,
        genres,
        status,
        rating,
      });
    });

    return {
      success: true,
      query,
      maxResults,
      totalItems: items.length,
      items,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function info(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("div.jdlrx h1").first().text().trim() || "";
    const thumb = $("div.fotoanime img").first().attr("src") || "";

    const info = {};
    $("div.infozingle p span").each((_, span) => {
      const $span = $(span);
      const text = $span.text().trim();
      const m = text.match(/^(.+?)\s*:\s*(.+)$/);
      if (!m) return;
      info[m[1].trim()] = m[2].trim();
    });

    const genres = [];
    $("div.infozingle p span").each((_, span) => {
      const $span = $(span);
      const text = $span.text().trim();
      if (!text.startsWith("Genre")) return;
      $span.find("a").each((_, a) => {
        const $a = $(a);
        const name = $a.text().trim();
        const href = $a.attr("href") || "";
        if (!name) return;
        const absolute = href.startsWith("http")
          ? href
          : `https://otakudesu.blog${href}`;
        const slug =
          absolute.replace(/https?:\/\/otakudesu\.blog\/genres\/|\/$/g, "") ||
          null;
        genres.push({ name, slug, url: absolute });
      });
    });

    const synopsis = $("div.sinopc").text().trim() || null;

    const episodes = [];
    $("div.episodelist ul li").each((_, li) => {
      const $li = $(li);
      const $a = $li.find("a").first();
      const title = $a.text().trim();
      const href = $a.attr("href") || "";
      const date = $li.find("span.zeebr").text().trim() || null;
      if (!title && !href) return;
      episodes.push({ title, url: href, date });
    });

    return {
      success: true,
      title,
      thumb,
      info,
      genres,
      synopsis,
      episodes,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function genreList() {
  try {
    const html = await fetchHtml("https://otakudesu.blog/genre-list/");
    const $ = cheerio.load(html);

    const genres = [];
    $("ul.genres li > a").each((_, a) => {
      const $a = $(a);
      const name = $a.text().trim();
      const href = $a.attr("href") || "";
      if (!name) return;
      genres.push({
        name,
        slug: href.replace(/\/genres\/|\/$/g, "") || null,
        url: `https://otakudesu.blog${href}`,
      });
    });

    return {
      success: true,
      total: genres.length,
      genres,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function genre(genre, page = 1) {
  try {
    const url = `https://otakudesu.blog/genres/${encodeURIComponent(genre)}/${page ? `page/${page}/` : ""}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const titleText =
      $("div.vezone div.rvad h1").first().text().trim() ||
      $("div.vezone h1").first().text().trim() ||
      "";
    const expectedTitle = `Daftar Genre ${genre}`;
    const genreName =
      titleText === expectedTitle
        ? genre
        : titleText.replace(/^Daftar Genre\s+/i, "").trim() || genre;

    const items = [];
    $("div.col-anime-con").each((_, el) => {
      const $el = $(el);
      const $title = $el.find("div.col-anime-title > a").first();
      const title = $title.text().trim();
      const url = $title.attr("href") || "";

      const studio = $el.find("div.col-anime-studio").text().trim() || null;
      const epsRaw = $el.find("div.col-anime-eps").text().trim();
      const episodes = epsRaw ? epsRaw.replace(/\s*Eps\s*/i, "").trim() : null;
      const ratingRaw = $el.find("div.col-anime-rating").text().trim();
      const rating = ratingRaw ? parseFloat(ratingRaw) : null;

      const genres = [];
      $el.find("div.col-anime-genre a").each((_, a) => {
        const $a = $(a);
        const name = $a.text().trim();
        const href = $a.attr("href") || "";
        if (!name) return;
        const absolute = href.startsWith("http")
          ? href
          : `https://otakudesu.blog${href}`;
        const slug =
          absolute.replace(/https?:\/\/otakudesu\.blog\/genres\/|\/$/g, "") ||
          null;
        genres.push({ name, slug, url: absolute });
      });

      const thumb = $el.find("div.col-anime-cover img").attr("src") || "";
      const synopsis = $el.find("div.col-synopsis").text().trim() || null;
      const date = $el.find("div.col-anime-date").text().trim() || null;
      const trailer = $el.find("div.col-anime-trailer a").attr("href") || null;

      if (!title && !url) return;
      items.push({
        title,
        url,
        studio,
        episodes,
        rating,
        genres,
        thumb,
        synopsis,
        date,
        trailer,
      });
    });

    if (!items.length) {
      return {
        success: true,
        genre: genreName,
        page,
        items: [],
        message: `No anime found for genre "${genre}" on page ${page}`,
      };
    }

    const totalText = $("div.pagenavix span.page-numbers.current")
      .first()
      .text()
      .trim();
    const total = totalText ? parseInt(totalText, 10) : 1;

    return {
      success: true,
      genre: genreName,
      page,
      totalPages: isNaN(total) ? 1 : total,
      totalItems: items.length,
      items,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function watch(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1.posttl").first().text().trim() || "";
    const postedBy = $("div.kategoz span").first().text().trim() || null;
    const releaseTime = $("div.kategoz span").eq(1).text().trim() || null;

    const episodes = [];
    $("#selectcog option").each((_, opt) => {
      const $opt = $(opt);
      const href = $opt.attr("value") || "";
      const text = $opt.text().trim();
      if (!href || href === "0") return;
      episodes.push({ title: text, url: href });
    });

    const prev =
      $("div.prevnext a[title='Episode Sebelumnya']").attr("href") || null;
    const next =
      $("div.prevnext a[title='Episode Selanjutnya']").attr("href") || null;
    const animeUrl = $("div.prevnext a[rel='follow']").attr("href") || null;

    const embedIframe =
      $("div#embed_holder iframe").first().attr("src") || null;

    const mirrors = [];
    $("div.mirrorstream ul").each((_, ul) => {
      const $ul = $(ul);
      const ulText = $ul.text().trim() || "";
      const resolutionMatch = ulText.match(/Mirror\s*(\d+p)/i);
      const resolution = resolutionMatch ? resolutionMatch[1] : null;
      const services = [];
      $ul.find("li a").each((_, a) => {
        const $a = $(a);
        const service = $a.text().trim();
        const dataContent = $a.attr("data-content") || "";
        const isDefault = $a.attr("data-default") === "true";
        if (!service || !dataContent) return;
        services.push({
          service,
          data: dataContent,
          isDefault: !!isDefault,
        });
      });
      if (resolution && services.length) {
        mirrors.push({ resolution, services });
      }
    });

    let nonce = null;
    try {
      const nonceRes = await fetch(
        "https://otakudesu.blog/wp-admin/admin-ajax.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          },
          body: "action=aa1208d27f29ca340c92c66d1926f13f",
        },
      );
      if (nonceRes.ok) {
        const nonceJson = await nonceRes.json();
        nonce = nonceJson?.data || null;
      }
    } catch (e) {
      console.error("Failed to fetch nonce:", e.message);
    }

    const streams = [];
    for (const mirror of mirrors) {
      for (const svc of mirror.services) {
        let streamUrl = null;
        if (nonce) {
          try {
            const decoded = JSON.parse(
              Buffer.from(svc.data, "base64").toString("utf-8"),
            );
            const body = new URLSearchParams({
              ...decoded,
              nonce,
              action: "2a3505c93b0035d3f455df82bf976b84",
            });
            const streamRes = await fetch(
              "https://otakudesu.blog/wp-admin/admin-ajax.php",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                },
                body: body.toString(),
              },
            );
            if (streamRes.ok) {
              const streamJson = await streamRes.json();
              const html = Buffer.from(
                streamJson?.data || "",
                "base64",
              ).toString("utf-8");
              const $s = cheerio.load(html);
              const src =
                $s("iframe").first().attr("src") ||
                $s("video").first().attr("src") ||
                $s("source").first().attr("src");
              if (src) streamUrl = src;
            }
          } catch (e) {
            console.error(
              `Failed to fetch stream for ${svc.service}:`,
              e.message,
            );
          }
        }
        streams.push({
          resolution: mirror.resolution,
          service: svc.service,
          isDefault: svc.isDefault,
          streamUrl,
        });
      }
    }

    return {
      success: true,
      title,
      postedBy,
      releaseTime,
      prev,
      next,
      animeUrl,
      embedIframe,
      mirrors,
      streams,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

async function upcoming() {
  try {
    const html = await fetchHtml("https://otakudesu.blog/jadwal-rilis/");
    const $ = cheerio.load(html);

    const schedule = [];
    $("div.kglist321").each((_, el) => {
      const day = $(el).find("h2").first().text().trim() || null;
      const items = [];
      $(el)
        .find("ul > li > a")
        .each((_, a) => {
          const $a = $(a);
          items.push({
            title: $a.text().trim(),
            url: $a.attr("href") || "",
          });
        });
      schedule.push({ day, items });
    });

    const title =
      $("div.jdlpot h1").first().text().trim() ||
      $("div.kgjdwl321 h1").first().text().trim() ||
      null;

    return {
      success: true,
      title,
      schedule,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

// Usage examples:
// (async () => {
//   const homeResult = await home();
//   console.log(homeResult);
//
//   const searchResult = await search("mahiro");
//   console.log(searchResult);
//
//   const genreListResult = await genreList();
//   console.log(genreListResult);
//
//   const genreResult = await genre("vampire", 1);
//   console.log(genreResult);
//
//   const infoResult = await info("https://otakudesu.blog/anime/onii-oshii-sub-indo/");
//   console.log(infoResult);
//
//   const watchResult = await watch("https://otakudesu.blog/episode/onchnosmhi-episode-12-sub-indo/");
//   console.log(watchResult);
//
//   const upcomingResult = await upcoming();
//   console.log(upcomingResult);
// })();
