/*
 * GitRoasted Scraper
 *
 * Base: https://imageprompt.org/api/ai/prompts/image
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";
import FormData from "form-data";

const URL = "https://gitroasted.netlify.app/";

const COMMON_HEADERS = {
  accept: "text/x-component",
  "accept-language": "en-US,en;q=0.9,id;q=0.8",
  "next-action": "60979563fdacfbf45d1dd085c7c1d7a5b76edf9ebe",
  "next-router-state-tree":
    "%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
  origin: "https://gitroasted.netlify.app",
  referer: "https://gitroasted.netlify.app/",
  "sec-ch-ua":
    '"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
};

function buildForm(username) {
  const form = new FormData();
  form.append("1_username", username);
  form.append("0", JSON.stringify([{ status: "idle" }, "$K1"]));
  return form;
}

function extractJsonFrames(rscText) {
  const frames = [];
  const lines = rscText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(\d+):(\{.*\}|\[.*\])$/s);
    if (!match) continue;

    const jsonStr = match[2];
    try {
      const parsed = JSON.parse(jsonStr);
      frames.push(parsed);
    } catch {
      // not valid JSON
    }
  }

  return frames;
}

function extractNestedJson(text) {
  const results = [];

  const statusSuccessRegex =
    /\{"status":"success","username":"([^"]+)".*?"user":(\{.*?\})\,"events":/s;
  const statusMatch = text.match(statusSuccessRegex);
  if (statusMatch) {
    try {
      const userObj = JSON.parse(statusMatch[2]);
      results.push({
        status: "success",
        username: statusMatch[1],
        user: userObj,
      });
    } catch {
      // fallback
    }
  }

  const roastRegex = /"roast":"((?:[^"\\]|\\.)*)"/g;
  let roastMatch;
  while ((roastMatch = roastRegex.exec(text)) !== null) {
    results.push({ roast: roastMatch[1].replace(/\\"/g, '"') });
  }

  const leaderboardRoastRegex = /"leaderboardRoast":"((?:[^"\\]|\\.)*)"/g;
  let lbMatch;
  while ((lbMatch = leaderboardRoastRegex.exec(text)) !== null) {
    results.push({ leaderboardRoast: lbMatch[1].replace(/\\"/g, '"') });
  }

  const scoreRegex = /"score":(\d+)/g;
  let scoreMatch;
  while ((scoreMatch = scoreRegex.exec(text)) !== null) {
    results.push({ score: parseInt(scoreMatch[1], 10) });
  }

  const totalStarsRegex = /"totalStars":(\d+)/g;
  let tsMatch;
  while ((tsMatch = totalStarsRegex.exec(text)) !== null) {
    results.push({ totalStars: parseInt(tsMatch[1], 10) });
  }

  const avatarRegex =
    /"avatar_url":"(https:\/\/avatars\.githubusercontent\.com\/[^"]+)"/g;
  let avatarMatch;
  while ((avatarMatch = avatarRegex.exec(text)) !== null) {
    results.push({ avatar_url: avatarMatch[1] });
  }

  const loginRegex = /"login":"([^"]+)"/g;
  let loginMatch;
  while ((loginMatch = loginRegex.exec(text)) !== null) {
    results.push({ login: loginMatch[1] });
  }

  const followersRegex = /"followers":(\d+)/g;
  let followersMatch;
  while ((followersMatch = followersRegex.exec(text)) !== null) {
    results.push({ followers: parseInt(followersMatch[1], 10) });
  }

  const followingRegex = /"following":(\d+)/g;
  let followingMatch;
  while ((followingMatch = followingRegex.exec(text)) !== null) {
    results.push({ following: parseInt(followingMatch[1], 10) });
  }

  const publicReposRegex = /"public_repos":(\d+)/g;
  let prMatch;
  while ((prMatch = publicReposRegex.exec(text)) !== null) {
    results.push({ public_repos: parseInt(prMatch[1], 10) });
  }

  return results;
}

function extractScoreBreakdown(text) {
  const breakdown = {};

  const impactMatch = text.match(/"impact":\{"total":(\d+)/);
  if (impactMatch) breakdown.impact = parseInt(impactMatch[1], 10);

  const consistencyMatch = text.match(/"consistency":\{"total":(\d+)/);
  if (consistencyMatch)
    breakdown.consistency = parseInt(consistencyMatch[1], 10);

  const qualityMatch = text.match(/"quality":\{"total":(\d+)/);
  if (qualityMatch) breakdown.quality = parseInt(qualityMatch[1], 10);

  const communityMatch = text.match(/"community":\{"total":(\d+)/);
  if (communityMatch) breakdown.community = parseInt(communityMatch[1], 10);

  const diversityMatch = text.match(/"diversity":\{"total":(\d+)/);
  if (diversityMatch) breakdown.diversity = parseInt(diversityMatch[1], 10);

  const experienceMatch = text.match(/"experience":\{"total":(\d+)/);
  if (experienceMatch) breakdown.experience = parseInt(experienceMatch[1], 10);

  const activityMatch = text.match(/"activity":\{"total":(\d+)/);
  if (activityMatch) breakdown.activity = parseInt(activityMatch[1], 10);

  const specialBonusMatch = text.match(/"specialBonus":\{"total":(\d+)/);
  if (specialBonusMatch)
    breakdown.specialBonus = parseInt(specialBonusMatch[1], 10);

  return breakdown;
}

function extractTopLanguages(text) {
  const langs = [];
  const regex = /\["([^"]+)",(\d+)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    langs.push({ name: match[1], percentage: parseInt(match[2], 10) });
  }
  return langs;
}

function extractArchetype(text) {
  const archetypeMatch = text.match(/"archetype":(\{[^}]+\})/);
  if (!archetypeMatch) return null;
  try {
    return JSON.parse(archetypeMatch[1]);
  } catch {
    return null;
  }
}

function extractEvents(text) {
  const events = [];
  const eventRegex =
    /\{"id":"(\d+)","type":"([^"]+)",.*?"created_at":"([^"]+)"/g;
  let match;
  while ((match = eventRegex.exec(text)) !== null) {
    events.push({
      id: match[1],
      type: match[2],
      created_at: match[3],
    });
  }
  return events;
}

export async function gitRoast(username) {
  if (!username) {
    return {
      success: false,
      error: "Username is required",
    };
  }

  try {
    const form = buildForm(username);

    const response = await axios.post(URL, form, {
      headers: {
        ...COMMON_HEADERS,
        ...form.getHeaders(),
      },
      maxRedirects: 0,
      timeout: 30000,
    });

    const rscText = response.data;
    const frames = extractJsonFrames(rscText);
    const nested = extractNestedJson(rscText);
    const scoreBreakdown = extractScoreBreakdown(rscText);
    const topLanguages = extractTopLanguages(rscText);
    const archetype = extractArchetype(rscText);
    const events = extractEvents(rscText);

    const merged = {};
    for (const item of nested) {
      if (item.status === "success" && item.user) {
        merged.user = item.user;
        merged.username = item.username;
        merged.targetUsername = item.username;
      }
      if (item.roast && !merged.roast) merged.roast = item.roast;
      if (item.leaderboardRoast && !merged.leaderboardRoast)
        merged.leaderboardRoast = item.leaderboardRoast;
      if (item.score && !merged.score) merged.score = item.score;
      if (item.totalStars && !merged.totalStars)
        merged.totalStars = item.totalStars;
      if (item.avatar_url && !merged.avatar_url)
        merged.avatar_url = item.avatar_url;
      if (item.login && !merged.login) merged.login = item.login;
      if (item.followers !== undefined && merged.followers === undefined)
        merged.followers = item.followers;
      if (item.following !== undefined && merged.following === undefined)
        merged.following = item.following;
      if (item.public_repos !== undefined && merged.public_repos === undefined)
        merged.public_repos = item.public_repos;
    }

    const user = merged.user || {};
    const profileImage = user.avatar_url || null;
    const displayName = user.name || user.login || username;
    const login = user.login || username;

    const totalScore = merged.score || 0;
    const totalStars = merged.totalStars || 0;
    const followers = merged.followers || 0;
    const following = merged.following || 0;
    const publicRepos = merged.public_repos || 0;

    const statsAtGlance = [
      { label: "Score", value: totalScore },
      { label: "Total Stars", value: totalStars },
      { label: "Followers", value: followers },
      { label: "Following", value: following },
      { label: "Repositories", value: publicRepos },
    ];

    const breakdownFormatted = {
      impact: scoreBreakdown.impact || 0,
      consistency: scoreBreakdown.consistency || 0,
      quality: scoreBreakdown.quality || 0,
      community: scoreBreakdown.community || 0,
      diversity: scoreBreakdown.diversity || 0,
      experience: scoreBreakdown.experience || 0,
      activity: scoreBreakdown.activity || 0,
      specialBonus: scoreBreakdown.specialBonus || 0,
    };

    const recentEvents = events.slice(0, 10).map((e) => ({
      type: e.type,
      created_at: e.created_at,
    }));

    return {
      success: true,
      username: username,
      targetUsername: login,
      profile: {
        displayName,
        username: login,
        avatar: profileImage,
        profileUrl: `https://github.com/${login}`,
      },
      score: {
        total: totalScore,
        breakdown: breakdownFormatted,
      },
      roast: {
        result: merged.roast || null,
        leaderboard: merged.leaderboardRoast || null,
        quote: archetype?.description || null,
        archetype: archetype || null,
      },
      activity: {
        recentEvents,
        totalCommits: publicRepos,
        repos: publicRepos,
        followers,
        following,
      },
      statsAtGlance,
      topLanguages,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || null,
    };
  }
}

export default { gitRoast };

/* USAGE EXAMPLE:

import { gitRoast } from "./18.js";

const result = await gitRoast("torvalds");
console.log(JSON.stringify(result, null, 2));

*/
