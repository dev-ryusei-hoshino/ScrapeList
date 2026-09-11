/*
 * ReactCH WhatsApp
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://reaction-whatsapp.edgeone.dev/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import readline from "readline";

async function connect(method, number) {
  if (method === "qr") {
    const res = await fetch("https://reaction-whatsapp.edgeone.dev/qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  }

  if (method === "number") {
    const res = await fetch("https://reaction-whatsapp.edgeone.dev/pair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phoneNumber: number,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  }

  throw new Error("Method tidak valid. Gunakan qr atau number.");
}

async function react(API_KEY, reaction = "✅", link) {
  const res = await fetch("https://reaction-whatsapp.edgeone.dev/react", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      emoji: reaction,
      link,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function cli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("=== WhatsApp Reaction CLI ===");
    console.log();
    console.log("1. QR");
    console.log("2. Pairing Number");
    console.log("3. React");
    console.log();

    const choice = (await ask(rl, "Pilih opsi [1/2/3]: ")).trim();

    let result;

    if (choice === "1") {
      console.log("\nMembuat QR...\n");

      result = await connect("qr");

      console.log("Response:");
      console.dir(result, { depth: null });
    } else if (choice === "2") {
      const number = (await ask(rl, "Nomor WhatsApp: ")).trim();

      if (!number) {
        throw new Error("Nomor WhatsApp tidak boleh kosong.");
      }

      console.log("\nMeminta pairing code...\n");

      result = await connect("number", number);

      console.log("Response:");
      console.dir(result, { depth: null });
    } else if (choice === "3") {
      const API_KEY = (await ask(rl, "API Key: ")).trim();
      const reaction =
        (await ask(rl, "Reaction [default: ✅]: ")).trim() || "✅";
      const link = (await ask(rl, "WhatsApp Channel URL: ")).trim();

      if (!API_KEY) {
        throw new Error("API Key tidak boleh kosong.");
      }

      if (!link) {
        throw new Error("Link tidak boleh kosong.");
      }

      console.log("\nMengirim reaction...\n");

      result = await react(API_KEY, reaction, link);

      console.log("Response:");
      console.dir(result, { depth: null });
    } else {
      throw new Error("Pilihan tidak valid.");
    }
  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    rl.close();
  }
}

cli();
export { react, connect };
