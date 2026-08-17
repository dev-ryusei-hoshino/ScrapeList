/*
 * SpeedTest
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://www.speedtest.net
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import { UniversalSpeedTest } from "universal-speedtest";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

async function getClientInfo() {
  try {
    const res = await axios.get("https://www.speedtest.net/api/js/config-sdk", {
      timeout: 10000,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        Referer: "https://www.speedtest.net/",
      },
    });
    return res.data;
  } catch (e) {
    console.error("config-sdk error:", e.message);
    return {};
  }
}

async function getServers() {
  try {
    const res = await axios.get(
      "https://www.speedtest.net/api/js/servers?engine=js&limit=20&distance=0",
      {
        timeout: 10000,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          Referer: "https://www.speedtest.net/",
        },
      },
    );
    return res.data;
  } catch (e) {
    console.error("servers error:", e.message);
    return [];
  }
}

async function runSpeedTest() {
  const st = new UniversalSpeedTest();
  const result = await st.performOoklaTest();

  return {
    pingResult: result.pingResult,
    downloadResult: result.downloadResult,
    bestServer: result.bestServer,
    totalTime: result.totalTime,
  };
}

async function runUploadTest(server) {
  if (!server) return null;

  const uploadUrl = server.url || `http://${server.host}/speedtest/upload.php`;
  const payload = Buffer.alloc(1024 * 1024, "x");

  try {
    const start = Date.now();
    await axios.post(uploadUrl, payload, {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/octet-stream",
        "Content-Length": payload.length,
      },
    });
    const durationSec = (Date.now() - start) / 1000;
    const speedMbps = (payload.length * 8) / (durationSec * 1000 * 1000);

    return {
      speed: parseFloat(speedMbps.toFixed(2)),
      totalTime: parseFloat(durationSec.toFixed(2)),
    };
  } catch (e) {
    console.error("upload test error:", e.message);
    return null;
  }
}

function minimalOutput(data) {
  const {
    client,
    pingResult,
    downloadResult,
    uploadResult,
    bestServer,
    totalTime,
  } = data;

  return {
    client: {
      ip: client.ip,
      isp: client.isp,
      location: client.location?.cityName || client.location,
    },
    ping: pingResult?.latency ? `${pingResult.latency} ms` : null,
    download: downloadResult?.speed ? `${downloadResult.speed} Mbps` : null,
    upload: uploadResult?.speed ? `${uploadResult.speed} Mbps` : null,
    server: bestServer ? `${bestServer.name} (${bestServer.sponsor})` : null,
    totalTime: `${totalTime}s`,
  };
}

function detailedOutput(data) {
  const {
    client,
    pingResult,
    downloadResult,
    uploadResult,
    bestServer,
    servers,
    totalTime,
  } = data;

  return {
    client,
    pingResult,
    downloadResult,
    uploadResult,
    bestServer,
    servers: servers?.slice(0, 5),
    totalTime,
  };
}

export async function speedtest(detailed = false) {
  const [clientInfo, servers, speedTest] = await Promise.all([
    getClientInfo(),
    getServers(),
    runSpeedTest(),
  ]);

  const uploadResult = await runUploadTest(speedTest.bestServer);

  const data = {
    client: {
      ip: clientInfo.ipAddress,
      isp: clientInfo.ispName,
      ispId: clientInfo.ispId,
      location: clientInfo.location,
    },
    pingResult: speedTest.pingResult,
    downloadResult: speedTest.downloadResult,
    uploadResult,
    bestServer: speedTest.bestServer,
    servers,
    totalTime: speedTest.totalTime,
  };

  return detailed ? detailedOutput(data) : minimalOutput(data);
}

/* EXAMPLE USAGE */

(async () => {
  try {
    const detailed = process.argv[2] === "detailed";
    const result = await speedtest(detailed);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
})();
