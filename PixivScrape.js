/*
 * Pixiv Search Scrape
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://www.pixiv.net/en/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const SEARCH_API = "https://www.pixiv.net/ajax/search/artworks/";
const DETAIL_API = "https://www.pixiv.net/ajax/illust/";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0";

const headers = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.pixiv.net/en/",
  Origin: "https://www.pixiv.net",
};

function toAbsolute(p) {
  if (!p) return null;
  return p.startsWith("http") ? p : "https://www.pixiv.net" + p;
}

function illustTypeLabel(t) {
  if (t === 0 || t === "0") return "illust";
  if (t === 1 || t === "1") return "manga";
  if (t === 2 || t === "2") return "ugoira";
  return "unknown";
}

async function getImageUrls(id) {
  try {
    const { data } = await axios.get(DETAIL_API + id, {
      headers,
      timeout: 20000,
    });
    const b = data?.body;
    if (!b || data.error) return { image: null, original: null };
    const u = b.urls || {};
    return {
      image: u.regular || u.master || null,
      original: u.original || null,
    };
  } catch {
    return { image: null, original: null };
  }
}

async function important(item) {
  const id = item.id || null;
  const { image, original } = id ? await getImageUrls(id) : {};
  return {
    id,
    title: item.title || null,
    illustType: illustTypeLabel(item.illustType),
    pageCount: item.pageCount ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    thumb: item.url || null,
    image: image || null,
    original: original || null,
    authorId: item.userId || null,
    authorName: item.userName || null,
    authorPage: item.userId ? toAbsolute("/en/users/" + item.userId) : null,
    postUrl: id ? toAbsolute("/en/artworks/" + id) : null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    bookmarkCount: item.bookmarkCount ?? null,
    likeCount: item.likeCount ?? null,
    viewCount: item.viewCount ?? null,
    commentCount: item.commentCount ?? null,
    isR18: !!item.xRestrict || item.sanityLevel === 6 || item.slt === 6,
    createDate: item.createDate || null,
  };
}

async function pixivSearch(query, page = 1) {
  if (!query || !query.trim()) {
    return {
      success: false,
      mess: "please input a search query",
    };
  }

  const word = query.trim();
  const p = parseInt(page, 10) || 1;

  const params = {
    word,
    order: "date_d",
    mode: "all",
    p,
    s_mode: "s_tag",
    type: "all",
    lang: "en",
  };

  try {
    const { data } = await axios.get(SEARCH_API + encodeURIComponent(word), {
      params,
      headers,
      timeout: 30000,
    });

    if (data.error) {
      return {
        success: false,
        mess: data.message || "pixiv search error",
      };
    }

    const body = data.body || {};
    const rawList = body.illustManga?.data || [];

    const data2 = await Promise.all(rawList.map(important));

    return {
      success: true,
      query: word,
      page: p,
      total: body.illustManga?.total ?? null,
      count: data2.length,
      data: data2,
    };
  } catch (err) {
    return {
      success: false,
      mess: err.message,
      status: err.response?.status || null,
    };
  }
}

function extractIllustId(input) {
  const s = String(input || "").trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/artworks\/(\d+)/);
  return m ? m[1] : null;
}

async function downloadOne(url, options = {}) {
  const imgHeaders = {
    "User-Agent": UA,
    Referer: "https://www.pixiv.net/",
  };

  const dir = options.dir
    ? path.resolve(options.dir)
    : path.join(process.cwd(), "pixiv_images");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = options.ext || path.extname(new URL(url).pathname) || ".jpg";
  const baseName = options.fileName
    ? options.fileName.replace(/[\\/:*?"<>|]/g, "_")
    : path.basename(new URL(url).pathname);
  const fileName = baseName.endsWith(ext) ? baseName : baseName + ext;
  const filePath = path.join(dir, fileName);

  const img = await axios.get(url, {
    headers: imgHeaders,
    responseType: "arraybuffer",
    timeout: options.timeout || 30000,
  });
  fs.writeFileSync(filePath, Buffer.from(img.data));
  return { fileName, filePath, bytes: img.data.length, url };
}

async function saveImage(input, options = {}) {
  if (!input) {
    return { success: false, mess: "please input an url or post url" };
  }

  const id = extractIllustId(input);
  if (id) {
    try {
      const { data } = await axios.get(DETAIL_API + id + "/pages", {
        headers,
        timeout: 20000,
      });

      if (data.error || !Array.isArray(data.body)) {
        return {
          success: false,
          mess: data.message || "failed to fetch pages",
        };
      }

      const pages = data.body;
      const saved = [];
      const failed = [];

      for (let i = 0; i < pages.length; i++) {
        const urls = pages[i].urls || {};
        const url = urls.original || urls.regular || urls.master;
        if (!url) {
          failed.push({ page: i, mess: "no image url" });
          continue;
        }

        const ext = path.extname(new URL(url).pathname) || ".jpg";
        const prefix = options.fileName
          ? options.fileName.replace(/[\\/:*?"<>|]/g, "_")
          : id;
        const suffix = pages.length > 1 ? "_p" + i : "";

        try {
          const r = await downloadOne(url, {
            dir: options.dir,
            fileName: prefix + suffix,
            ext,
            timeout: options.timeout,
          });
          saved.push(r);
        } catch (e) {
          failed.push({
            page: i,
            mess: e.message,
            status: e.response?.status || null,
          });
        }
      }

      return {
        success: true,
        id,
        postUrl: toAbsolute("/en/artworks/" + id),
        pageCount: pages.length,
        savedCount: saved.length,
        failedCount: failed.length,
        saved,
        failed,
      };
    } catch (err) {
      return {
        success: false,
        mess: err.message,
        status: err.response?.status || null,
      };
    }
  }

  try {
    const r = await downloadOne(input, options);
    return { success: true, ...r };
  } catch (err) {
    return {
      success: false,
      mess: err.message,
      status: err.response?.status || null,
      url: input,
    };
  }
}

async function bulkSaveFromSearch(query, page = 1, options = {}) {
  const res = await pixivSearch(query, page);
  if (!res.success || !res.data.length) {
    return {
      success: false,
      mess: res.mess || "no results",
      query,
      page,
      saved: [],
      failed: [],
    };
  }

  const saved = [];
  const failed = [];

  for (const post of res.data) {
    const url = post.original || post.image || post.thumb;
    if (!url) {
      failed.push({ id: post.id, mess: "no image url" });
      continue;
    }

    const r = await saveImage(url, {
      dir: options.dir,
      fileName: (post.id || Date.now()) + "_" + (post.title || "").slice(0, 50),
      timeout: options.timeout,
    });

    if (r.success) saved.push(r);
    else failed.push({ id: post.id, mess: r.mess, status: r.status });
  }

  return {
    success: true,
    query,
    page,
    total: res.total,
    savedCount: saved.length,
    failedCount: failed.length,
    saved,
    failed,
  };
}

export { pixivSearch, saveImage, bulkSaveFromSearch };

/* EXAMPLE USAGE

const res = await pixivSearch("hakurei reimu", 1);
console.log(JSON.stringify(res, null, 2));

const saved = await saveImage(res.data[0].original || res.data[0].image, {
  dir: "./pixiv_images",
  fileName: res.data[0].id + "_" + res.data[0].title.slice(0, 50),
});
console.log(JSON.stringify(saved, null, 2));

const savedCustom = await saveImage("https://i.pximg.net/.../12345_p0.jpg", {
  dir: "./downloads",
  fileName: "my_art",
  ext: ".jpg",
  timeout: 60000,
});
console.log(JSON.stringify(savedCustom, null, 2));

const bulk = await bulkSaveFromSearch("Mahiro Oyama", 1, { dir: "./pixiv_images" });
console.log(JSON.stringify(bulk, null, 2));

const fromPost = await saveImage("https://www.pixiv.net/en/artworks/148535563", { dir: "./pixiv_images" });
console.log(JSON.stringify(fromPost, null, 2));
*/

const fromPost = await saveImage(
  "https://www.pixiv.net/en/artworks/148535563",
  { dir: "./pixiv_images" },
);
console.log(JSON.stringify(fromPost, null, 2));
