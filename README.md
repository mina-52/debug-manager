# DebugManager

バグ・デバッグ情報をチームで管理できる Web アプリケーションです。  
Next.js + Supabase で構築し、Vercel にデプロイして使用します。

---

## 主な機能

### バグ管理
- バグの登録・編集・削除
- **ステータス管理**: 未対応 / 対応中 / 解決済 / クローズ
- **優先度設定**: 低 / 中 / 高 / 緊急
- タグによる分類
- 説明文（再現手順・期待動作など）の記録

### プロジェクト管理
- プロジェクトの作成・編集・削除
- バグをプロジェクトに紐付けて分類

### コメント
- バグごとにコメントを投稿
- 自分のコメントを削除

### 検索・フィルター
- タイトルでのキーワード検索
- ステータス・優先度・プロジェクトでの絞り込み

### ダッシュボード
- 総バグ数・未対応・対応中・解決済・緊急バグの件数を一覧表示
- 最近更新されたバグを5件表示

### 通知
- **アプリ内通知**: サイドバーのベルアイコンに未読バッジ。Supabase Realtime によりリロード不要で即時反映
- **Slack 通知**: チームの Slack チャンネルへ自動投稿（緊急バグは赤色＋ `@here`）
- 通知対象: コメント投稿 / ステータス変更 / 新規バグ登録

### 認証
- メールアドレス＋パスワードでのログイン・新規登録
- ログアウト

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| デプロイ | Vercel |

---

## 画面構成

```
/                   → /dashboard にリダイレクト
/auth/login         → ログイン
/auth/signup        → 新規登録
/dashboard          → ダッシュボード（統計・最近の更新）
/bugs               → バグ一覧（検索・フィルター）
/bugs/new           → バグ新規登録
/bugs/[id]          → バグ詳細・コメント
/bugs/[id]/edit     → バグ編集
/projects           → プロジェクト一覧・管理
```

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/あなたのユーザー名/debug-manager.git
cd debug-manager
npm install
```

### 2. Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** で `supabase-schema.sql` の内容を実行
3. 続けて **SQL Editor** で `supabase-notifications.sql` を実行（通知機能用）
4. **Project Settings → API** から以下をコピー：
   - Project URL
   - anon public key
   - service_role key（通知機能で使用。**公開しないこと**）

### 3. 環境変数を設定

`.env.local` ファイルをプロジェクトルートに作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 通知機能（Slack を使う場合）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
NOTIFY_WEBHOOK_SECRET=任意のランダムな文字列
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

---

## データベース構成

`supabase-schema.sql` を Supabase の SQL Editor で実行すると以下のテーブルが作成されます。

### `projects` テーブル
| カラム | 型 | 説明 |
|--------|----|------|
| id | uuid | プライマリキー |
| name | text | プロジェクト名 |
| description | text | 説明（任意） |
| created_by | uuid | 作成者（auth.users 参照） |
| created_at | timestamptz | 作成日時 |

### `bugs` テーブル
| カラム | 型 | 説明 |
|--------|----|------|
| id | uuid | プライマリキー |
| title | text | タイトル |
| description | text | 説明（任意） |
| status | enum | open / in_progress / resolved / closed |
| priority | enum | low / medium / high / critical |
| project_id | uuid | プロジェクト（任意） |
| assigned_to | uuid | 担当者（任意） |
| created_by | uuid | 作成者 |
| tags | text[] | タグ一覧 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時（自動更新） |

### `comments` テーブル
| カラム | 型 | 説明 |
|--------|----|------|
| id | uuid | プライマリキー |
| bug_id | uuid | バグ（bugs 参照） |
| content | text | コメント本文 |
| created_by | uuid | 作成者 |
| created_at | timestamptz | 作成日時 |

### `notification_events` テーブル（通知）
| カラム | 型 | 説明 |
|--------|----|------|
| id | uuid | プライマリキー |
| type | enum | comment_added / status_changed / bug_created |
| bug_id | uuid | 対象バグ |
| actor_id | uuid | 操作した人 |
| title | text | 対象バグのタイトル |
| body | text | コメント本文など |
| meta | jsonb | priority / old_status / new_status |
| created_at | timestamptz | 作成日時 |

1イベントにつき1行。Slack への投稿はこのテーブルを見るため、宛先が何人でも投稿は1通になります。

### `notifications` テーブル（通知）
| カラム | 型 | 説明 |
|--------|----|------|
| id | uuid | プライマリキー |
| event_id | uuid | notification_events 参照 |
| user_id | uuid | 受信者 |
| is_read | boolean | 既読フラグ |
| created_at | timestamptz | 作成日時 |

宛先ごとにファンアウトした行。アプリ内のベル・未読管理はこちらを使います。

---

## 通知機能のセットアップ

### 仕組み

書き込みはクライアントから Supabase へ直接行われるため、通知の発火は **Postgres トリガー**で行っています。バグ登録・ステータス変更・コメント投稿を検知して `notification_events` と `notifications` に行を積むので、アプリ側の書き込みコードには手を入れていません。

```
bugs / comments への書き込み
  └→ Postgres トリガー
       ├→ notification_events（1行）─→ Database Webhook ─→ /api/notify/slack ─→ Slack
       └→ notifications（宛先の人数分）─→ Realtime ─→ ベルの未読バッジ
```

### Slack Incoming Webhook を作成

1. [api.slack.com/apps](https://api.slack.com/apps) で **Create New App → From scratch**
2. **Incoming Webhooks** を On にし、**Add New Webhook to Workspace** で投稿先チャンネルを選択
3. 発行された URL を `SLACK_WEBHOOK_URL` に設定

Incoming Webhook は無料・通数無制限です。

### Supabase Database Webhook を設定

Supabase Dashboard → **Database → Webhooks** で新規作成：

| 項目 | 値 |
|------|-----|
| Table | `notification_events` |
| Events | `Insert` |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://あなたのサイト.vercel.app/api/notify/slack` |
| HTTP Headers | `x-notify-secret`: `NOTIFY_WEBHOOK_SECRET` と同じ値 |

> Database Webhook は Supabase 側から外部 URL を叩くため、**localhost には届きません**。ローカルで Slack 連携を確認する場合は Route Handler を直接叩いてください：
>
> ```bash
> curl -X POST http://localhost:3000/api/notify/slack \
>   -H 'content-type: application/json' \
>   -H 'x-notify-secret: あなたのシークレット' \
>   -d '{"type":"INSERT","table":"notification_events","record":{"id":"00000000-0000-0000-0000-000000000000","type":"bug_created","bug_id":null,"actor_id":null,"title":"テスト通知","body":"動作確認","meta":{"priority":"critical"},"created_at":"2026-01-01T00:00:00Z"}}'
> ```

### Slack を使わない場合

`SLACK_WEBHOOK_URL` を設定しなければ Slack 投稿はスキップされ、アプリ内通知だけが動作します。

---

## Vercel へのデプロイ

1. GitHub にプッシュ
2. [vercel.com](https://vercel.com) でリポジトリをインポート
3. Environment Variables に以下を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`（本番 URL。Slack のリンク生成に使用）
   - `SLACK_WEBHOOK_URL`
   - `NOTIFY_WEBHOOK_SECRET`
4. **Deploy** をクリック

デプロイ完了後、Supabase の **Authentication → URL Configuration** に Vercel の URL を登録してください：
- Site URL: `https://あなたのサイト.vercel.app`
- Redirect URLs: `https://あなたのサイト.vercel.app/auth/callback`

---

## 無料枠について

| サービス | 主な制限 |
|----------|----------|
| Supabase | DB 500MB・50,000 MAU・1週間非アクティブで自動停止 |
| Vercel | 帯域 100GB/月・商用利用不可（個人・学習用途は無料） |

---

## ライセンス

MIT
