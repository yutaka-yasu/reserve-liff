// line-integration/api/line-webhook.js
export const config = { api: { bodyParser: false } };

import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // 生ボディ取得
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuf = Buffer.concat(chunks);
  const bodyStr = bodyBuf.toString();

  // 署名検証
  const CHANNEL_SECRET = process.env.CHANNEL_SECRET || "";
  const signature = crypto.createHmac("sha256", CHANNEL_SECRET).update(bodyBuf).digest("base64");
  if (req.headers["x-line-signature"] !== signature) return res.status(403).end();

  const ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || "";
  const payload = JSON.parse(bodyStr);
  const events = payload.events || [];

  for (const ev of events) {
    if (ev.type === "message" && ev.message?.type === "text") {
      const replyToken = ev.replyToken;
      const text = ev.message.text.trim();

      let reply = "お問合せありがとうございます。予約は「予約」、変更は「変更」、キャンセルは「キャンセル」と入力してください。";
      if (/予約/.test(text)) reply = "ご予約ですね。ご希望日時を「YYYY-MM-DD HH:mm」で、続けてメニュー名もお送りください。";
      if (/変更/.test(text)) reply = "変更ですね。新しいご希望日時を「YYYY-MM-DD HH:mm」で返信してください。";
      if (/キャンセル/.test(text)) reply = "キャンセルですね。お名前と予約日時をお知らせください。";

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ACCESS_TOKEN}` },
        body: JSON.stringify({ replyToken, messages: [{ type: "text", text: reply }] }),
      });
    }
  }
  res.status(200).end();
}
