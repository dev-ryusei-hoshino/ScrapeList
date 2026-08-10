/*
 * Blue Archive Coming Banner Scraper ( Global )
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://ba.joexyz.online
 * License: MIT
 */

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DEFAULT_URL = "https://ba.joexyz.online/global/banners";

const BANNER_SEARCH_TOKEN = '\\"banner\\":{';

function getBaseUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return new URL(DEFAULT_URL).origin;
  }
}

function unescapeRscPayload(raw) {
  let text = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  text = text.replace(/"\$D([^"]+)"/g, '"$1"');
  return text;
}

function extractBannerObjects(html) {
  const token = BANNER_SEARCH_TOKEN;
  const results = [];
  let idx = 0;

  while (true) {
    const found = html.indexOf(token, idx);
    if (found === -1) break;

    const braceStart = html.indexOf("{", found + token.length - 1);
    if (braceStart === -1) {
      idx = found + 1;
      continue;
    }

    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < html.length; i++) {
      if (html[i] === "{") depth++;
      if (html[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    const rawJson = html.substring(braceStart, end);
    const unescaped = unescapeRscPayload(rawJson);

    try {
      const obj = JSON.parse(unescaped);
      results.push(obj);
    } catch {
      // WIWOKDETOK
    }

    idx = end;
  }

  return results;
}

export async function fetchBannersHtml(
  url = DEFAULT_URL,
  userAgent = DEFAULT_UA,
) {
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

export function parseBanners(html, baseUrl = getBaseUrl(DEFAULT_URL)) {
  const rawBanners = extractBannerObjects(html);
  const seen = new Set();
  const banners = [];

  for (const banner of rawBanners) {
    if (seen.has(banner.id)) continue;
    seen.add(banner.id);

    const pickupStudents = (banner.pickupStudents || []).map((s) => ({
      id: s.id,
      devName: s.devName,
      schaleDbId: s.schaleDbId,
      name: s.name,
      school: s.school,
      club: s.club,
      rarity: s.rarity,
      combatClass: s.combatClass,
      combatRole: s.combatRole,
      combatPosition: s.combatPosition,
      weaponType: s.weaponType,
      attackType: s.attackType,
      defenseType: s.defenseType,
      height: s.height,
      voiceActor: s.voiceActor,
      illustrator: s.illustrator,
      designer: s.designer,
      introduction: s.introduction,
      hobbies: s.hobbies,
      searchTags: s.searchTags,
      baseVariantId: s.baseVariantId,
      isLimitedGlobal: s.isLimitedGlobal,
      isReleasedGlobal: s.isReleasedGlobal,
      isWelfareGlobal: s.isWelfareGlobal,
      hasBondGearGlobal: s.hasBondGearGlobal,
      imageUrl: s.id
        ? `${baseUrl}/cdn/v2/images/students/icons/${s.id}.png`
        : null,
    }));

    banners.push({
      id: banner.id,
      name: banner.name,
      startDate: banner.startDate,
      endDate: banner.endDate,
      freePulls: banner.freePulls,
      isSelectablePickup: banner.isSelectablePickup,
      pickupStudents,
    });
  }

  banners.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return banners;
}

export async function scrapeComingBanners(
  url = DEFAULT_URL,
  userAgent = DEFAULT_UA,
) {
  try {
    const html = await fetchBannersHtml(url, userAgent);
    const banners = parseBanners(html, getBaseUrl(url));

    const now = new Date();
    const coming = [];
    const ongoing = [];
    const ended = [];

    for (const banner of banners) {
      const start = new Date(banner.startDate);
      const end = new Date(banner.endDate);
      const status = now < start ? "coming" : now > end ? "ended" : "ongoing";

      const entry = {
        ...banner,
        status,
        durationDays: Math.round((end - start) / (1000 * 60 * 60 * 24)),
      };

      if (status === "coming") coming.push(entry);
      else if (status === "ongoing") ongoing.push(entry);
      else ended.push(entry);
    }

    return {
      success: true,
      summary: {
        total: banners.length,
        coming: coming.length,
        ongoing: ongoing.length,
        ended: ended.length,
      },
      banners,
      coming,
      ongoing,
      ended,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
    };
  }
}

/* USAGE EXAMPLE: */

(async () => {
  const result = await scrapeComingBanners();
  console.log(JSON.stringify(result, null, 2));
})();
