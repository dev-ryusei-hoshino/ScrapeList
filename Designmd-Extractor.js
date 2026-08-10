/*
 * Design.md Generator
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://www.design-extractor.com
 * License: MIT
 */

import crypto from "crypto";
import axios from "axios";

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

function generateUserAgent() {
  const ua = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  ];
  const idx = crypto.randomInt(0, ua.length);
  return ua[idx];
}

async function extractDesign(targetUrl) {
  const sessionId = generateSessionId();
  const userAgent = generateUserAgent();

  const postPayload = { url: targetUrl };
  const postHeaders = {
    "Content-Type": "application/json",
    Origin: "https://www.design-extractor.com",
    Referer: "https://www.design-extractor.com/",
    "User-Agent": userAgent,
    Cookie: `__session=${sessionId}`,
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-ch-ua":
      '"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };

  let jobData;
  try {
    const postRes = await axios.post(
      "https://www.design-extractor.com/api/extract",
      postPayload,
      { headers: postHeaders },
    );
    jobData = postRes.data;
    console.log(`Job created: ${jobData.jobId}, slug: ${jobData.slug}`);
  } catch (err) {
    throw new Error(`POST failed: ${err.message}`);
  }

  const { jobId, slug } = jobData;

  const pollInterval = 5000;
  let statusData = null;
  let attempts = 0;
  const maxAttempts = 120;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      const statusUrl = `https://www.design-extractor.com/api/extract/s/${slug}`;
      const statusRes = await axios.get(statusUrl, {
        headers: {
          "User-Agent": userAgent,
          Cookie: `__session=${sessionId}`,
          Referer: "https://www.design-extractor.com/",
          Accept: "*/*",
        },
      });
      statusData = statusRes.data;
      console.log(
        `Status: ${statusData.status}, progress: ${statusData.progress || 0}%`,
      );

      if (statusData.status === "completed") {
        console.log(`Extraction completed!`);
        break;
      } else if (statusData.status === "failed") {
        throw new Error(
          `Extraction failed: ${statusData.error || "unknown error"}`,
        );
      }
    } catch (err) {
      console.error(`Polling error: ${err.message}`);
    }
  }

  if (!statusData || statusData.status !== "completed") {
    throw new Error("Timeout or incomplete extraction");
  }

  const result = statusData.result;

  return result;
}

/* USAGE EXAMPLE: */

(async () => {
  const url = process.argv[2] || "https://example.com/";
  try {
    const response_data = await extractDesign(url);
    console.log(JSON.stringify(response_data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
