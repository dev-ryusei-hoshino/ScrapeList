/*
 * SfileMobi Downloader
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://sfile.co
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import puppeteer from "puppeteer";

async function scrapeSfile(TARGET_URL) {
  if (!TARGET_URL) {
    return {
      success: false,
      mess: "please input an url",
    };
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
    );

    await page.setExtraHTTPHeaders({
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });

    const result = {
      success: false,
      pageUrl: null,
      downloadButtonHref: null,
      downloadUrl: null,
      waitSeconds: null,
      downloadPage: null,
      fileInfo: null,
      downloadButton: null,
      directDownloadLinks: null,
      rawDownloadLinkCount: 0,
      error: null,
    };

    try {
      await page.goto(TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      result.pageUrl = page.url();

      const downloadBtn = await page.$("#download");
      if (!downloadBtn) {
        result.error = "Download button tidak ditemukan di halaman target.";
        return result;
      }

      result.downloadButtonHref = await page
        .$eval("#download", (el) => el.getAttribute("href")?.trim())
        .catch(() => null);
      result.downloadUrl = await page
        .$eval("#download", (el) => el.getAttribute("data-dw-url")?.trim())
        .catch(() => null);
      result.waitSeconds = await page
        .$eval("#download", (el) =>
          parseInt(el.getAttribute("data-wait-seconds") || "0", 10),
        )
        .catch(() => null);

      const downloadUrl = result.downloadUrl || result.downloadButtonHref;
      if (!downloadUrl) {
        result.error = "Download URL tidak ditemukan.";
        return result;
      }

      await page.goto(downloadUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      result.downloadPage = {
        url: page.url(),
        status: 200,
        title: await page.title(),
        heading: await page
          .$eval("h1", (el) => el.textContent.trim())
          .catch(() => null),
        contentType: "text/html",
      };

      const isExpired = await page
        .$eval("h1", (el) => /expired/i.test(el.textContent))
        .catch(() => false);

      result.downloadPage.isExpired = isExpired;

      if (isExpired) {
        const fileBoxText = await page
          .$eval(".rounded-2xl.bg-slate-50", (el) => el.textContent.trim())
          .catch(() => "");

        const filenameMatch = fileBoxText.match(/File:\s*([^\n]+)/);
        const sizeMatch = fileBoxText.match(/Size:\s*([^\n]+)/);

        result.fileInfo = {
          filename: filenameMatch ? filenameMatch[1].trim() : null,
          size: sizeMatch ? sizeMatch[1].trim() : null,
        };

        const expiredBtn = await page.$("#expired");
        if (expiredBtn) {
          result.renewLink = {
            href: await page
              .$eval("#expired", (el) => el.getAttribute("href")?.trim())
              .catch(() => null),
            text: await page
              .$eval("#expired", (el) => el.textContent.trim())
              .catch(() => null),
          };
        }

        result.success = true;
        result.directDownloadLinks = null;
        return result;
      }

      const btnText = await page
        .$eval("#download", (el) => el.textContent.trim())
        .catch(() => null);
      const btnHref = await page
        .$eval("#download", (el) => el.getAttribute("href")?.trim())
        .catch(() => null);
      const dataSmartlink = await page
        .$eval("#download", (el) => el.getAttribute("data-smartlink")?.trim())
        .catch(() => null);
      const dataDirectSmartlink = await page
        .$eval("#download", (el) =>
          el.getAttribute("data-direct-smartlink")?.trim(),
        )
        .catch(() => null);
      const dataDirectDownload = await page
        .$eval("#download", (el) =>
          el.getAttribute("data-direct-download")?.trim(),
        )
        .catch(() => null);

      let filename = null;
      let filesize = null;
      const btnTextMatch =
        btnText && btnText.match(/Download File\s*\(([^)]+)\)/i);
      if (btnTextMatch && btnTextMatch[1]) {
        const sizeMatch = btnTextMatch[1].match(/^(.+?)\s+\(([^)]+)\)$/);
        if (sizeMatch) {
          filename = sizeMatch[1].trim();
          filesize = sizeMatch[2].trim();
        } else {
          filesize = btnTextMatch[1].trim();
        }
      }

      const directDownloadLinks = [];
      if (btnHref) {
        directDownloadLinks.push({
          text: btnText || "Download File",
          href: btnHref,
          type: "href",
        });
      }
      if (dataSmartlink) {
        directDownloadLinks.push({
          text: "Smartlink",
          href: dataSmartlink,
          type: "smartlink",
        });
      }
      if (dataDirectSmartlink) {
        directDownloadLinks.push({
          text: "Direct Smartlink",
          href: dataDirectSmartlink,
          type: "direct_smartlink",
        });
      }
      if (dataDirectDownload) {
        directDownloadLinks.push({
          text: "Direct Download",
          href: dataDirectDownload,
          type: "direct_download",
        });
      }

      result.success = true;
      result.fileInfo = {
        filename: filename || null,
        size: filesize || null,
      };
      result.downloadButton = {
        text: btnText || null,
        href: btnHref || null,
        dataSmartlink: dataSmartlink || null,
        dataDirectSmartlink: dataDirectSmartlink || null,
        dataDirectDownload: dataDirectDownload || null,
      };
      result.directDownloadLinks = directDownloadLinks.length
        ? directDownloadLinks
        : null;
      result.rawDownloadLinkCount = directDownloadLinks.length;

      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  } finally {
    await browser.close();
  }
}

/* EXAMPLE USAGE
const result = await scrapeSfile("https://sfile.co/xxxxx");
console.log(JSON.stringify(result, null, 2));
*/
