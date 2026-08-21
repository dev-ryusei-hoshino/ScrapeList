/*
 * Rewind AI
 *
 * Author: Ryusei Hoshino (https://github.com/dev-ryusei-hoshino)
 * Base: https://rewind.ai/chat/
 * Source: https://whatsapp.com/channel/0029VbDnVYyK0IBjO8RGfq3N
 *
 * Note: Jangan di hapus we em nya, hargai dev-scraper kecil! >:(
 */

import axios from "axios";

async function chat(prompt) {
  if (!prompt) {
    return {
      success: false,
      mess: "please input a prompt!",
    };
  }
  const response = await axios.post(
    "https://api.rewind.ai/v1/chat/completions/",
    {
      messages: [{ role: "user", content: prompt }],
      model: "qwen/qwen-2.5-7b-instruct",
      stream: true,
    },
    {
      headers: { "Content-Type": "application/json" },
      responseType: "stream",
    },
  );

  let fullText = "";
  for await (const chunk of response.data) {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]")
          return { success: true, prompt, response: fullText };
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) fullText += content;
        } catch {}
      }
    }
  }
  return {
    success: true,
    prompt: prompt,
    response: fullText,
  };
}

/* USAGE EXAMPLE:
 * const result = await chat("Hello! I'm Ryusei Hoshino! Who and What are you?");
 * console.log(JSON.stringify(result, null, 2));
 */
