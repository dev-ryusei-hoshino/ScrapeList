/*
 * komik Scrape
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://analyxirkomik.zone.id/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import { pathToFileURL } from "node:url";

export async function scrapeHome() {
  const response = await fetch("https://analyxirkomik.zone.id/api/home");

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data home: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.retcode !== 0) {
    throw new Error(result.message ?? "API home mengembalikan error");
  }

  result.data = (result.data ?? []).map((manga) => ({
    ...manga,
    detail_url: `https://analyxirkomik.zone.id/manga/${manga.manga_id}`,
  }));

  return result;
}

export async function scrapeTop(period) {
  if (!period) {
    return {
      success: false,
      mess: "param: period needed ( alltime, weekly, daily )",
    };
  }

  const endpoints = {
    daily: "https://analyxirkomik.zone.id/api/top-daily",
    weekly: "https://analyxirkomik.zone.id/api/top-weekly",
    alltime: "https://analyxirkomik.zone.id/api/top-all-time",
  };
  const url = endpoints[period];

  if (!url) {
    throw new Error(
      'Parameter scrapeTop harus "daily", "weekly", atau "alltime"',
    );
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data top ${period}: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.retcode !== 0) {
    throw new Error(result.message ?? `API top ${period} mengembalikan error`);
  }

  result.data = (result.data ?? []).map((manga) => ({
    ...manga,
    detail_url: `https://analyxirkomik.zone.id/manga/${manga.manga_id}`,
  }));

  return result;
}

export async function scrapeManhwa() {
  const response = await fetch(
    "https://analyxirkomik.zone.id/api/manga-manhwa",
  );

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data manhwa: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.retcode !== 0) {
    throw new Error(result.message ?? "API manga manhwa mengembalikan error");
  }

  result.data = (result.data ?? []).map((manga) => ({
    ...manga,
    detail_url: `https://analyxirkomik.zone.id/manga/${manga.manga_id}`,
  }));

  return result;
}

export async function scrapeMangaList() {
  const response = await fetch(
    "https://analyxirkomik.zone.id/api/manga-list?page=1&page_size=10&is_update=true&sort=latest&sort_order=desc",
  );

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data manga list: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.retcode !== 0) {
    throw new Error(result.message ?? "API manga list mengembalikan error");
  }

  result.data = (result.data ?? []).map((manga) => ({
    ...manga,
    detail_url: `https://analyxirkomik.zone.id/manga/${manga.manga_id}`,
  }));

  return result;
}

export async function scrapeSearch(query) {
  if (!query) {
    return {
      success: false,
      mess: "param: query needed",
    };
  }

  const response = await fetch(
    `https://analyxirkomik.zone.id/api/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data search: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (result.retcode !== 0) {
    throw new Error(result.message ?? "API search mengembalikan error");
  }

  result.data = (result.data ?? []).map((manga) => ({
    ...manga,
    detail_url: `https://analyxirkomik.zone.id/manga/${manga.manga_id}`,
  }));

  return result;
}

/* CLI */
async function cli() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  node scraper.js --home
  node scraper.js --top <period>
  node scraper.js --manhwa
  node scraper.js --list
  node scraper.js --search <query>

Options:
  --home              Scrape manga home
  --top <period>      Scrape top manga
                      period: daily, weekly, alltime
  --manhwa            Scrape daftar manhwa
  --list              Scrape manga list
  --search <query>    Search manga
  --help, -h          Tampilkan bantuan
`);
    return;
  }

  try {
    let result;

    switch (args[0]) {
      case "--home":
        result = await scrapeHome();
        break;

      case "--top": {
        const period = args[1];

        if (!period) {
          throw new Error(
            "Period diperlukan. Gunakan: daily, weekly, atau alltime",
          );
        }

        result = await scrapeTop(period);
        break;
      }

      case "--manhwa":
        result = await scrapeManhwa();
        break;

      case "--list":
        result = await scrapeMangaList();
        break;

      case "--search": {
        const query = args.slice(1).join(" ");

        if (!query) {
          throw new Error("Query diperlukan untuk --search");
        }

        result = await scrapeSearch(query);
        break;
      }

      default:
        throw new Error(`Option tidak dikenal: ${args[0]}`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));

    process.exitCode = 1;
  }
}

const isCli =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isCli) {
  await cli();
      }
