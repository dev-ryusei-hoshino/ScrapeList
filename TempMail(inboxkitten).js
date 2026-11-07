/*
 * Temp Mail (InboxKitten)
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://inboxkitten.com/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";

async function getEmailAndInbox(name) {
  name = String(name).replace(/[^a-zA-Z0-9._%+-@]/g, "");
  try {
    const res = await axios.get(
      `https://inboxkitten.com/api/v1/mail/list?recipient=${name}`,
    );

    if (res.statusText !== "OK")
      return { success: false, message: "Server Error" };

    const data = await res.data;

    const emails = await Promise.all(
      data.map(async (mail) => {
        const htmlResponse = await fetch(
          `https://inboxkitten.com/api/v1/mail/getHtml?region=us-west1&key=${encodeURIComponent(mail.storage.key)}`,
        );
        const html = await htmlResponse.text();

        return {
          key: mail.storage.key,
          subject: mail.message.headers.subject,
          from: mail.message.headers.from,
          html,
        };
      }),
    );

    return { success: true, email: `${name}@inboxkitten.com`, inbox: emails };
  } catch (e) {
    return { success: false, mess: e.message };
  }
}
const res = await getEmailAndInbox("Iroha Jane 123");
console.log(res);
