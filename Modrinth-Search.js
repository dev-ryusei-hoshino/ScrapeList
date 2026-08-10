/*
 * Modrinth Mod Search Scrape
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://modrinth.com
 * License: MIT
 */

const MODRINTH_URL = "https://api.modrinth.com/v3/search";
const LIMIT = 20;

function buildSearchUrl(query, limit) {
  const encodedQuery = encodeURIComponent(query);
  return `${MODRINTH_URL}?query=${encodedQuery}&index=relevance&limit=${limit}&new_filters=project_types+=+\`mod\``;
}

function extractHits(data) {
  if (!data || !Array.isArray(data.hits)) return [];
  return data.hits.map((h) => ({
    project_id: h.project_id,
    version_id: h.version_id,
    name: h.name,
    slug: h.slug,
    url: `https://modrinth.com/mod/${h.slug}`,
    author: h.author,
    summary: h.summary,
    downloads: h.downloads,
    follows: h.follows,
    license: h.license,
    categories: h.categories,
    loaders: h.loaders,
    game_versions: h.game_versions,
    icon_url: h.icon_url,
    date_created: h.date_created,
    date_modified: h.date_modified,
    server_side: h.server_side,
    client_side: h.client_side,
    environment: h.environment,
  }));
}

export async function searchModrinth(query, limit = LIMIT) {
  if (!query) {
    return {
      success: false,
      error: "Harap Masukkan Query | Please Insert The Query",
    };
  }

  const url = buildSearchUrl(query, limit);
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
      Accept: "application/json",
      Origin: "https://modrinth.com",
      Referer: "https://modrinth.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const data = await response.json();
  return {
    success: true,
    query: query,
    total_hits: data.total_hits,
    page: data.page,
    hits_per_page: data.hits_per_page,
    results: extractHits(data),
  };
}

/* USAGE EXAMPLE: */

(async () => {
  const result = await searchModrinth("Yes Steve Model");
  console.log(JSON.stringify(result, null, 2));
})();
