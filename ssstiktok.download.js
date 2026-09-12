/*
 * Tiktok Downloader
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://ssstiktok.download/ (https://www.tikwm.com/api/)
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

async function main(link) {
  const form = new FormData();
  form.append("url", link);

  const res = await fetch("https://www.tikwm.com/api/", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  return data;
}

/* EXAMPLE USAGE */
(async () => {
  try {
    const res = await main("https://vt.tiktok.com/ZSqaqKd2k/");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
