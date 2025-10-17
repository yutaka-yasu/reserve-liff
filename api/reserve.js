// line-integration/api/reserve.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
  const { lineUserId, lineDisplayName, startAt, menu, name, tel, note } = req.body || {};

  // 必須チェック（最低限）
  if (!startAt || !menu || !name) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  // 予約保存：Vercel無料枠ではファイル永続化不可
  // まずは送信だけ（永続化は後でSupabase/Googleシートに切替）

  // LINEに確認メッセ（Push）
  if (lineUserId && ACCESS_TOKEN) {
    const text = [
      "ご予約ありがとうございます！",
      `${lineDisplayName || name} 様`,
      `日時：${startAt}`,
      `メニュー：${menu}`,
      "変更は「変更」、キャンセルは「キャンセル」と返信してください。"
    ].join("\n");

    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
    });
  }

  return res.status(200).json({ ok: true });
}
