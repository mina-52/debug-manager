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
3. **Project Settings → API** から以下をコピー：
   - Project URL
   - anon public key

### 3. 環境変数を設定

`.env.local` ファイルをプロジェクトルートに作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
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

---

## Vercel へのデプロイ

1. GitHub にプッシュ
2. [vercel.com](https://vercel.com) でリポジトリをインポート
3. Environment Variables に以下を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
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
