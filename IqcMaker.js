/*
 * IQC Maker
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://iqc.ranggacode.my.id
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import https from "https";
import fs from "fs";

/**
 * Generate chat image from IQC API
 * @param {Object} payload - Chat payload
 * @param {string} payload.sender - "self" or "other"
 * @param {string} payload.message - Message text
 * @param {string} [payload.timestamp="21:02"] - Timestamp HH:MM
 * @param {string} [payload.time="21:02"] - Time HH:MM
 * @param {string} [payload.carrier="INDOSAT"] - Carrier name
 * @param {number} [payload.battery=88] - Battery 0-100
 * @param {number} [payload.signalStrength=4] - Signal 0-5
 * @param {boolean} [payload.wifi=true] - WiFi on/off
 * @param {boolean} [payload.darkMode=true] - Dark mode
 * @param {boolean} [payload.isDark=true] - Is dark
 * @param {boolean} [payload.readStatus=true] - Read status
 * @param {string} [payload.emojiStyle="apple"] - Emoji style
 * @param {string} [payload.caption=""] - Caption
 * @returns {Promise<{buffer: Buffer, contentType: string, save: (path: string) => void}>}
 */
export function generate(payload) {
  const body = {
    sender: payload.sender,
    message: payload.message,
    timestamp: payload.timestamp || "21:02",
    time: payload.time || payload.timestamp || "21:02",
    status: {
      carrierName: payload.carrier || "INDOSAT",
      carrier: payload.carrier || "INDOSAT",
      batteryPercentage: payload.battery ?? 88,
      battery: payload.battery ?? 88,
      signalStrength: payload.signalStrength ?? 4,
      wifi: payload.wifi ?? true,
      wifiStatus: payload.wifi ?? true,
      darkMode: payload.darkMode ?? true,
      isDark: payload.isDark ?? true,
    },
    readStatus: payload.readStatus ?? true,
    emojiStyle: payload.emojiStyle || "apple",
    caption: payload.caption || "",
    battery: payload.battery ?? 88,
    carrier: payload.carrier || "INDOSAT",
    signalStrength: payload.signalStrength ?? 4,
    wifi: payload.wifi ?? true,
    darkMode: payload.darkMode ?? true,
    isDark: payload.isDark ?? true,
  };

  const data = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "iqc.ranggacode.my.id",
      path: "/api/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Accept: "*/*",
        Origin: "https://iqc.ranggacode.my.id",
        Referer: "https://iqc.ranggacode.my.id/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers["content-type"];
        resolve({
          buffer,
          contentType,
          save: (path) => fs.writeFileSync(path, buffer),
        });
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export default { generate };

/* EXAMPLE:

* PAYLOAD EXAMPLE:
const payload = {
 sender: 'self', // 'self' || 'other'
 message: 'Halo bang, lagi apa?',
 timestamp: '21:02',
 time: '21:02',
 carrier: 'INDOSAT',
 battery: 88,
 signalStrength: 4,
 wifi: true,
 darkMode: true,
 isDark: true,
 readStatus: true,
 emojiStyle: 'apple',
 caption: '',
};

* USAGE:
const result = await generate(payload);
result.save('output.png');

*/
