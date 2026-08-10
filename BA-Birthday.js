/*
 * Blue Archive Student's Birthday Scraper ( Global )
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Source: https://ba.joexyz.online
 * License: MIT
 */

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DEFAULT_URL = "https://ba.joexyz.online/birthdays";

const STUDENTS_SEARCH_TOKEN = '\\"loadedStudents\\":[';
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function extractStudentsArray(html) {
  const token = STUDENTS_SEARCH_TOKEN;
  const results = [];
  const found = html.indexOf(token);
  if (found === -1) return results;

  const bracketStart = html.indexOf("[", found + token.length - 2);
  if (bracketStart === -1) return results;

  let depth = 0;
  let end = bracketStart;
  let inString = false;
  let escape = false;

  for (let i = bracketStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (inString) {
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const rawJson = html.substring(bracketStart, end);
  const unescaped = unescapeRscPayload(rawJson);

  try {
    const arr = JSON.parse(unescaped);
    if (Array.isArray(arr)) results.push(...arr);
  } catch {
    // skip if parse fails
  }

  return results;
}

function parseBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const match = birthdayStr.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?/);
  if (!match) return null;
  const month = MONTH_NAMES.indexOf(match[1]);
  const day = parseInt(match[2], 10);
  if (month === -1) return null;
  return { month, day };
}

export async function fetchBirthdaysHtml(
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

export function parseStudents(html, baseUrl = getBaseUrl(DEFAULT_URL)) {
  const rawStudents = extractStudentsArray(html);
  const seen = new Set();
  const students = [];

  for (const s of rawStudents) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);

    const bd = parseBirthday(s.birthday);

    students.push({
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
      age: s.age,
      birthday: s.birthday,
      birthdayMonth: bd ? bd.month : null,
      birthdayDay: bd ? bd.day : null,
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
    });
  }

  students.sort((a, b) => {
    if (a.birthdayMonth !== b.birthdayMonth) {
      return a.birthdayMonth - b.birthdayMonth;
    }
    return a.birthdayDay - b.birthdayDay;
  });

  return students;
}

export async function scrapeBirthdays(
  url = DEFAULT_URL,
  userAgent = DEFAULT_UA,
) {
  try {
    const html = await fetchBirthdaysHtml(url, userAgent);
    const students = parseStudents(html, getBaseUrl(url));

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const upcoming = [];
    const passed = [];
    const todayStudents = [];

    for (const s of students) {
      const isToday =
        s.birthdayMonth === currentMonth && s.birthdayDay === currentDay;
      const isUpcoming =
        s.birthdayMonth > currentMonth ||
        (s.birthdayMonth === currentMonth && s.birthdayDay > currentDay);

      if (isToday) {
        todayStudents.push(s);
      } else if (isUpcoming) {
        upcoming.push(s);
      } else {
        passed.push(s);
      }
    }

    return {
      success: true,
      summary: {
        total: students.length,
        today: todayStudents.length,
        upcoming: upcoming.length,
        passed: passed.length,
      },
      students,
      today: todayStudents,
      upcoming,
      passed,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
    };
  }
}

/* USAGE EXAMPLE:

import { scrapeBirthdays } from "./7.js";

const result = await scrapeBirthdays();
// result.success  => true | false
// result.upcoming => array of upcoming birthdays
// result.today    => array of birthdays today
// result.passed   => array of already passed birthdays
*/

(async () => {
  const result = await scrapeBirthdays();
  console.log(JSON.stringify(result, null, 2));
})();
