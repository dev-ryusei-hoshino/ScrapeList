/*
 * AlightMotion Premium Generator V4
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://am.dapjisync.my.id/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

async function sendLink(email) {
  const res = await fetch("https://am.dapjisync.my.id/api/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": "FREE",
    },
    body: JSON.stringify({
      gmail: email,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

async function verifyLink(email, link) {
  const res = await fetch("https://am.dapjisync.my.id/api/verif", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": "FREE",
    },
    body: JSON.stringify({
      gmail: email,
      link: link,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

async function cli() {
  const rl = readline.createInterface({
    input,
    output,
  });

  try {
    const email = await rl.question("Email: ");

    if (!email.trim()) {
      console.log("Email tidak boleh kosong.");
      return;
    }

    console.log("\nMengirim magic link...");

    const sendResult = await sendLink(email.trim());

    console.log("Response:", JSON.stringify(sendResult, null, 2));

    const link = await rl.question("\nMagic link: ");

    if (!link.trim()) {
      console.log("Magic link tidak boleh kosong.");
      return;
    }

    console.log("\nMemverifikasi magic link...");

    const verifyResult = await verifyLink(email.trim(), link.trim());

    console.log("Response:", JSON.stringify(verifyResult, null, 2));
  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    rl.close();
  }
}

cli();
export { verifyLink, sendLink };
