/*
 * Temp Mail (emailqu)
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://emailqu.com/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";

async function getDomainList() {
  try {
    const res = await axios.get("https://emailqu.com/api/domains");

    return res.data;
  } catch (e) {
    return { success: false, mess: e.message ?? "internal server error" };
  }
}

async function getRandomDomain() {
  try {
    const res = await getDomainList();
    const domains = res.domains;
    const randomDomain =
      domains[Math.floor(Math.random() * domains.length)].domain;

    return { success: true, domain: randomDomain };
  } catch (e) {
    return { success: false, mess: e.message ?? "internal server error" };
  }
}

async function getRandomName() {
  try {
    const res = await axios.get("https://emailqu.com/api/random-username");

    return res.data;
  } catch (e) {
    return { success: false, mess: e.message ?? "internal server error" };
  }
}

async function getRandomEmail(params) {
  try {
    const username = await getRandomName();
    const domain = await getRandomDomain();
    const email = username.username + "@" + domain.domain;
    return { success: true, email };
  } catch (e) {
    return { success: false, mess: e.message ?? "internal server error" };
  }
}

async function checkEmail(email) {
  try {
    const domain = await getRandomDomain();
    email = email.includes("@") ? email : `${email}@${domain.domain}`;

    const res = await axios.get(
      `https://emailqu.com/api/public/emails/${email}`,
    );

    const data = res.data;

    delete data.address;
    data.address = email;

    return data;
  } catch (e) {
    return { success: false, mess: e.message ?? "internal server error" };
  }
}

/* 
> Get list of all the domains that they had:
 - getDomainList()

> Get Random Username:
 - getRandomName()

> Get Random Domain:
 - getRandomDomain()

> Get Random Email ( Username + Domain ):
 - getRandomEmail()

> Check Email's Inbox
 - checkEmail(email: string)



# Examples:
const inbox = await checkEmail("IrohaDoe123@flobati.space");
console.log(inbox);

Random:
const email = await getRandomEmail();
const inbox = await checkEmail(email.email);
console.log(inbox);

*/
