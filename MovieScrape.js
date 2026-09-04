/*
 * Movies Scrape
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://zaammoviesnr.netlify.app
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */
 

async function list(action) {
  if (!action)
    return {
      success: false,
      error: "action needed",
      action_lists: ["latest", "top-rated", "upcoming", "popular"],
    };
  const res = await fetch(
    `https://zaammoviesnr.netlify.app/.netlify/functions/zaam-movies?action=${action}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  const data = await res.json();
  const results = data.results.map((movie) => ({
    ...movie,
    link: `https://zaammoviesnr.netlify.app/movie/${movie.slug}`,
  }));

  return {
    success: true,
    result: results,
  };
}

async function get(url) {
  if (!url)
    return {
      success: false,
      error: "no url detected",
    };

  const slug = url.replace("https://zaammoviesnr.netlify.app/film/", "");

  const res = await fetch(
    `https://zaammoviesnr.netlify.app/.netlify/functions/zaam-movies?action=detail&slug=${slug}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  const data = await res.json();
  const result = data?.results || data?.data?.results || null;

  return {
    success: true,
    results: result,
  };
}

async function search(query) {
  if (!query)
    return {
      success: false,
      error: "a query needed",
    };

  const res = await fetch(
    `https://zaammoviesnr.netlify.app/.netlify/functions/zaam-movies?action=search&q=${query}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  const data = await res.json();

  const results = data.results.map((movie) => ({
    ...movie,
    link: `https://zaammoviesnr.netlify.app/film/${movie.slug}`,
  }));

  return {
    success: true,
    result: results,
  };
}

/* EXAMPLE USAGE: */
(async () => {
  //   const res = await get("https://zaammoviesnr.netlify.app/film/movie-950387");
  //   const res = await search("Spiderman");
  const res = await list("popular");
  console.log(JSON.stringify(res, null, 2));
})();
