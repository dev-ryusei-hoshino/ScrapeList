/*
 * TempMail - akunlama.com
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://akunlama.com/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

async function getNewEmail(username) {
  if (!username) {
    const frontName = [
      "haru",
      "yuki",
      "sora",
      "nana",
      "mika",
      "iroha",
      "akari",
      "hina",
      "yuna",
      "rin",
      "mio",
      "emi",
      "aya",
      "mei",
      "riko",
      "saki",
      "kana",
      "kira",
      "aoi",
      "rei",
      "yui",
      "mari",
      "nami",
      "runa",
      "shiro",
      "kuro",
      "hana",
      "suzu",
      "kaori",
      "sayu",
      "miku",
      "niko",
      "risa",
      "eri",
      "mina",
      "noa",
      "nana",
      "yume",
      "koko",
      "momo",
      "fuyu",
      "tsuki",
      "ame",
      "hoshi",
      "yori",
      "kumi",
      "umi",
      "yuki",
      "asahi",
      "koharu",
      "kanon",
      "madoka",
      "tomoka",
      "nanami",
      "misaki",
      "chihiro",
      "shiori",
      "kaede",
      "sakura",
      "momoka",
      "hinata",
      "sumire",
      "hotaru",
      "komachi",
      "tsubaki",
      "azusa",
      "serika",
      "ayaka",
      "yukino",
      "haruka",
      "akane",
      "fuuka",
      "izumi",
      "kasumi",
      "manaka",
      "ruriko",
      "yuzuki",
      "himari",
      "kohane",
      "suzune",
    ];

    const endName = [
      "chan",
      "san",
      "kun",
      "nya",
      "nyaa",
      "neko",
      "mimi",
      "koko",
      "yume",
      "sora",
      "yuki",
      "hana",
      "hime",
      "kira",
      "luna",
      "star",
      "moon",
      "sky",
      "cloud",
      "rain",
      "snow",
      "wind",
      "wave",
      "light",
      "night",
      "dream",
      "love",
      "heart",
      "cute",
      "sweet",
      "soft",
      "happy",
      "sleepy",
      "lazy",
      "tiny",
      "mini",
      "pixel",
      "byte",
      "code",
      "dev",
      "tech",
      "bot",
      "mail",
      "space",
      "world",
      "zone",
      "hub",
      "lab",
      "base",
      "core",
      "link",
      "net",
      "web",
      "cloud",
      "online",
      "digital",
      "random",
      "simple",
      "normal",
      "hidden",
      "unknown",
      "private",
      "user",
      "guest",
      "account",
      "box",
      "drop",
      "wave",
      "flow",
      "zero",
      "one",
      "neo",
      "nova",
      "nox",
      "void",
      "echo",
      "zen",
      "kai",
      "rio",
      "ren",
      "aki",
      "asa",
      "ame",
      "ao",
      "yori",
      "mari",
      "mika",
      "niko",
      "riku",
      "suzu",
      "kuma",
      "tama",
    ];

    const randomFront = frontName[Math.floor(Math.random() * frontName.length)];

    const randomEnd = endName[Math.floor(Math.random() * endName.length)];

    username = `${randomFront}_${randomEnd}`;
  }

  username = username.trim().replace(/\s+/g, "_");
  const res = await fetch(
    `https://akunlama.com/api/list?recipient=${username}`,
    {
      method: "GET",
    },
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return {
    success: true,
    username: username,
    email: username + "@akunlama.com",
    login: `https://akunlama.com/inbox/${username}/list`,
    inbox: data,
  };
}

async function checkInbox(username) {
  if (!username)
    return {
      success: false,
      mess: "please input an username",
      pesan: "tolong masukkan username",
    };

  username = username.trim().replace(/\s+/g, "_");

  const res = await fetch(
    `https://akunlama.com/api/list?recipient=${username}`,
    {
      method: "GET",
    },
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return {
    success: true,
    username: username,
    email: username + "@akunlama.com",
    login: `https://akunlama.com/inbox/${username}/list`,
    inbox: data,
  };
}

/* EXAMPLE USAGE */
(async () => {
  // GET NEW EMAIL
  //   const email = await getNewEmail();
  //   console.log(JSON.stringify(email, null, 2));
  //
  // GET NEW EMAIL WITH YOUR OWN USERNAME
  //   const myEmail = await getNewEmail("your Username");
  //   console.log(JSON.stringify(myEmail, null, 2));
  //
  // CHECK INBOX
  //   const res = await checkInbox("your username");
  //   console.log(JSON.stringify(res, null, 2));
})();
