import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import timezone from 'dayjs-plugin-timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const tz = process.env.TIMEZONE || 'Asia/Tokyo';
const jsonDbPath = process.env.JSON_DB_PATH || './data/reservations.json';

function loadReservations() {
  try {
    return JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
  } catch (e) {
    return [];
  }
}

async function push(to, text) {
  if (!ACCESS_TOKEN || !to) return;
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] })
  });
}

async function main() {
  const now = dayjs().tz(tz);
  const targetDate = now.add(1, 'day').format('YYYY-MM-DD');
  const list = loadReservations();
  for (const r of list) {
    const start = dayjs(r.startAt).tz(tz);
    if (start.format('YYYY-MM-DD') === targetDate) {
      const text = [
        '【明日のご予約のご案内】',
        `${r.lineDisplayName || r.name} 様`,
        `日時：${start.format('YYYY-MM-DD HH:mm')}`,
        `メニュー：${r.menu}`,
        'ご来店をお待ちしております。変更・キャンセルはこのまま返信してください。'
      ].join('\n');
      await push(r.lineUserId, text);
    }
  }
  console.log('Reminders checked at', now.format());
}

main().catch(console.error);