/*
 * GenerateTempMailV1 ( Token Support ) [ FIXED ]
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://temp-mail.io
 * License: MIT
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "tempMails.json");

async function readDatabase() {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeDatabase(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function createEmail() {
  const response = await fetch(
    "https://api.internal.temp-mail.io/api/v3/email/new",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        min_name_length: 10,
        max_name_length: 10,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gagal generate email: ${response.status}`);
  }

  const data = await response.json();

  if (data.email && data.token) {
    const database = await readDatabase();
    database[data.email] = {
      token: data.token,
      created_at: new Date().toISOString(),
    };
    await writeDatabase(database);
  }

  return {
    success: true,
    email: data.email,
    token: data.token,
  };
}

export async function checkInbox(email, token) {
  if (!email || !token) {
    throw new Error("Parameter email dan token wajib diisi.");
  }

  const response = await fetch(
    `https://api.internal.temp-mail.io/api/v3/email/${email}/messages?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        origin: "https://temp-mail.io",
        referer: "https://temp-mail.io/",
        "application-name": "web",
        "application-version": "4.0.0",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
      },
    },
  );

  let text = await response.text();
  let inboxData = [];
  let parseError = null;
  try {
    inboxData = JSON.parse(text);
  } catch (e) {
    parseError = e.message;
    try {
      inboxData = JSON.parse(text.trim());
    } catch {
      try {
        const cleaned = text.replace(/^\uFEFF/, "").trim();
        inboxData = JSON.parse(cleaned);
      } catch {
        inboxData = [];
      }
    }
  }

  const result = {
    success: response.ok,
    httpStatus: response.status,
    extractedLinks: [],
    fetchedLinks: [],
    inbox_data: inboxData,
    parseError: parseError || null,
  };

  if (!response.ok) {
    result.error = `HTTP Error dari temp-mail: ${response.status}`;
    return result;
  }

  if (Array.isArray(inboxData) && inboxData.length > 0) {
    const bodyText = inboxData[0].body_text || "";

    const regex = /https:\/\/[^\s"'><)]+/g;
    const matches = bodyText.match(regex);

    if (matches) {
      result.extractedLinks = [...new Set(matches)];

      for (const link of result.extractedLinks) {
        try {
          const linkResponse = await fetch(link);
          result.fetchedLinks.push({
            original_url: link,
            status: linkResponse.status,
            final_url: linkResponse.url,
          });
        } catch (err) {
          result.fetchedLinks.push({
            original_url: link,
            error: err.message,
          });
        }
      }
    }
  }

  return result;
}

/* USAGE EXAMPLE: */

const account = await createEmail();
console.log("Email dibuat:", account.email, "|", "Token:", account.token);

const inbox = await checkInbox(account.email, account.token);
console.log("Inbox:", inbox);
