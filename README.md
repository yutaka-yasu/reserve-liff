# LINE 予約フル連携 追加パッケージ

このフォルダを既存アプリに同梱するだけで、
1) LINEログイン（LIFF）
2) 予約完了時の自動メッセージ（Messaging API）
3) 前日リマインド（CLIスクリプト）
4) キーワード応答（予約/変更/キャンセル）

を実装できます。

## 構成
- `server.js` … Expressサーバ（/api/reserve, /api/line-webhook）
- `public/index.html` … LIFFで開く予約フォーム（/reserve）
- `scripts/send-reminders.js` … 前日リマインド送信用スクリプト
- `.env.example` … 必要な環境変数の雛形
- `package.json` … 依存関係・スクリプト

## 使い方（ローカル動作）
```bash
cd line-integration
cp .env.example .env
# .env を編集して CHANNEL_SECRET / CHANNEL_ACCESS_TOKEN / LIFF_ID を設定

npm install
npm run dev
# → http://localhost:3001/healthz で確認
# → http://localhost:3001/reserve で予約フォーム
```

## デプロイ
- Render / Railway / Vercel（Node）などに `line-integration` をそのままアップ
- 環境変数に `.env` と同じ値を設定
- LINE Developers コンソールで Webhook URL を `https://<your-host>/api/line-webhook` に設定し有効化
- LIFF のエンドポイントURLに `https://<your-host>/reserve` を設定

## 既存サイトからの導線
- 既存のトップやメニューから `https://<your-host>/reserve` へのリンク／ボタンを設置してください。

## リマインドの運用
- 毎日9:00に前日分を送る例（cron）:
  ```
  0 9 * * * cd /path/to/line-integration && /usr/bin/node scripts/send-reminders.js >> reminder.log 2>&1
  ```

## 保存先（データストア）
- 既定は `data/reservations.json`（ファイル）です。
- Googleスプレッドシート等に変更したい場合は、STORAGE=google_sheets としてアダプタを追加してください（雛形はご用意可能）。

---
生成日時: 2025-10-17T15:41:58.920400