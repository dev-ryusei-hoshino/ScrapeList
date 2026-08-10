/*
 * CEK IQ
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: -
 * License: MIT
 */

import chalk from "chalk";

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getIQ(number) {
  const seed = hashString(String(number || "0"));
  return 40 + (seed % 141); // 40 - 180
}

function getTitle(iq) {
  if (iq < 50) return "🧠 Cacing Darat (Sangat Bodoh)";
  if (iq < 70) return "🤡 Bodoh";
  if (iq < 85) return "🥴 Di Bawah Rata-rata";
  if (iq < 100) return "😐 Rata-rata";
  if (iq < 115) return "🙂 Di Atas Rata-rata";
  if (iq < 130) return "😎 Pintar";
  if (iq < 145) return "🤓 Jenius";
  return "👑 Jenius Luar Biasa";
}

function resolveTarget(msg, args, senderNumber) {
  const m = msg.message || {};
  const ctx =
    m.extendedTextMessage?.contextInfo ||
    m.imageMessage?.contextInfo ||
    m.videoMessage?.contextInfo ||
    {};

  const mentioned = ctx.mentionedJid || [];
  if (mentioned.length) {
    const j = String(mentioned[0]).replace(/:/g, "");
    return { number: j.split("@")[0].replace(/\D/g, ""), name: "User" };
  }

  if (msg.quoted?.sender) {
    return {
      number: String(msg.quoted.sender).replace(/\D/g, ""),
      name: msg.quoted.pushName || "User",
    };
  }

  const arg = args.join(" ").trim();
  if (arg) {
    const cleaned = arg.replace(/[^0-9]/g, "");
    if (cleaned) return { number: cleaned, name: arg };
  }

  return { number: senderNumber, name: "Kamu" };
}

export default {
  name: "Cek IQ",
  command: ["cekiq"],
  category: "fun",
  description: "Cek skor IQ (random tapi konsisten per nomor)",
  usage: "cekiq <target|kosong=self>",

  async run(iroha, msg, { jid, args, senderNumber }) {
    try {
      const target = resolveTarget(msg, args, senderNumber);

      if (!target.number) {
        return msg.reply("Target tidak valid.");
      }

      const iq = getIQ(target.number);
      const title = getTitle(iq);

      const text =
        `🧠 *CEK IQ*\n\n` +
        `👤 Target : ${target.name}\n` +
        `📱 Nomor : ${target.number}\n` +
        `📊 IQ    : *${iq}*\n` +
        `🏷️ Title : ${title}`;

      await iroha.sendMessage(jid, { text }, { quoted: msg });
    } catch (e) {
      console.log(chalk.red("[-] [CEK IQ]"), e);
      await msg.reply("❌ Gagal mengecek IQ.");
    }
  },
};
