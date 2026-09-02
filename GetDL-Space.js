/*
 * GetDL Space
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://getdl.space
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

async function download(url) {
  try {
    const response = await fetch("https://getdl.space/api/download", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Origin: "https://getdl.space",
        Referer: "https://getdl.space/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (e) {
    console.error(e);
  }
}

/* EXAMPLE USAGE */
(async () => {
  const res = await download("https://vt.tiktok.com/ZS4y5vc3F");
  console.log(JSON.stringify(res, null, 2));
})();
