import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import timezone from 'dayjs-plugin-timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Tokyo';

// --- simple storage layer (local json) ---
const storageType = process.env.STORAGE || 'local_json';
const jsonDbPath = process.env.JSON_DB_PATH || './data/reservations.json';
function loadReservations() {
  try {
    return JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
  } catch (e) {
    return [];
  }
}
function saveReservations(list) {
  fs.mkdirSync(path.dirname(jsonDbPath), { recursive: true });
  fs.writeFileSync(jsonDbPath, JSON.stringify(list, null, 2), 'utf-8');
}

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Reservation endpoint
app.post('/api/reserve', async (req, res) => {
  try {
    const { lineUserId, lineDisplayName, startAt, menu, name, tel, note } = req.body || {};
    if (!startAt || !menu || !name) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    const id = 'rsv_' + crypto.randomBytes(8).toString('hex');
    const record = {
      id, lineUserId, lineDisplayName, startAt, menu, name, tel, note: note || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Save
    if (storageType === 'local_json') {
      const list = loadReservations();
      list.push(record);
      saveReservations(list);
    } else {
      // TODO: implement other storage adapters
    }

    // Push confirmation to LINE
    if (lineUserId && ACCESS_TOKEN) {
      const text = [
        'ご予約ありがとうございます！',
        `${lineDisplayName || name} 様`,
        `日時：${startAt}`,
        `メニュー：${menu}`,
        '変更は「変更」、キャンセルは「キャンセル」と返信してください。'
      ].join('\n');

      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{ type: 'text', text }]
        })
      });
    }

    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// LINE webhook
function verifySignature(req, body) {
  const signature = crypto.createHmac('sha256', CHANNEL_SECRET).update(body).digest('base64');
  const header = req.headers['x-line-signature'];
  return signature === header;
}

app.post('/api/line-webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const bodyStr = req.body.toString();
    if (!verifySignature(req, bodyStr)) return res.status(403).end();

    const payload = JSON.parse(bodyStr);
    const events = payload.events || [];
    for (const ev of events) {
      if (ev.type === 'message' && ev.message?.type === 'text') {
        const text = (ev.message.text || '').trim();
        const replyToken = ev.replyToken;

        if (/予約|よやく/i.test(text)) {
          await replyText(replyToken, 'ご予約ですね。ご希望日時を「YYYY-MM-DD HH:mm」で、続けてメニュー名もお送りください。');
        } else if (/変更/.test(text)) {
          await replyText(replyToken, '変更ですね。新しいご希望日時を「YYYY-MM-DD HH:mm」で返信してください。');
        } else if (/キャンセル/.test(text)) {
          await replyText(replyToken, 'キャンセルですね。お名前と予約日時をお知らせください。');
        } else {
          await replyText(replyToken, 'お問合せありがとうございます。予約は「予約」、変更は「変更」、キャンセルは「キャンセル」と入力してください。');
        }
      }
    }
    res.status(200).end();
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

async function replyText(replyToken, text) {
  if (!ACCESS_TOKEN) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] })
  });
}

// Serve static reserve page if placed here (optional)
app.use('/reserve', express.static(path.resolve('./public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LINE integration server running on :${PORT}`);
});