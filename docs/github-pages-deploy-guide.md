# Next.js × GitHub Pages デプロイ 変更内容まとめ

## 目的

Next.js アプリを **GitHub Pages** で公開するために、以下の変更を行った。

---

## 1. Next.js を「Static Export」に設定する

### ファイル: `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',                    // ← ポイント①
  basePath: '/githubpagesSample',      // ← ポイント②
  images: {
    unoptimized: true,                 // ← ポイント③
  },
};

export default nextConfig;
```

### 各設定の解説

| 設定 | 説明 |
|---|---|
| `output: 'export'` | **ポイント①** Next.js を「静的エクスポートモード」にする。`npm run build` を実行すると、通常の `.next/` ではなく `out/` ディレクトリに **純粋な HTML/CSS/JS ファイル** が生成される。これにより Node.js サーバーなしで配信できる。 |
| `basePath: '/githubpagesSample'` | **ポイント②** GitHub Pages の URL は `https://<ユーザー名>.github.io/<リポジトリ名>/` となるため、すべてのリンクやアセットのパスに `/githubpagesSample` をプレフィックスとして付ける必要がある。これを自動で行ってくれる設定。 |
| `images.unoptimized: true` | **ポイント③** Next.js の `<Image>` コンポーネントによる画像最適化はサーバーサイドで動作するため、静的ホスティングでは使えない。この設定で最適化を無効にする。 |

### Static Export で使えない機能

Static Export を使う場合、以下の Next.js 機能は使えない点に注意：

- Server Components（データフェッチ）
- API Routes（`app/api/` ディレクトリ）
- ミドルウェア（`middleware.ts`）
- ISR（Incremental Static Regeneration）
- `<Image>` の自動最適化

→ 今回のカウンターアプリはクライアントサイドのみなので問題なし。

---

## 2. GitHub Actions ワークフローの作成

### ファイル: `.github/workflows/deploy.yml`

GitHub Actions は `.github/workflows/` ディレクトリに YAML ファイルを置くことで定義される。

```yaml
name: Deploy to GitHub Pages

# ─── トリガー設定 ───
# release ブランチへの push 時に実行される
on:
  push:
    branches:
      - release

# ─── 権限設定 ───
# GitHub Pages へのデプロイに必要な権限を付与
permissions:
  contents: read       # リポジトリの読み取り
  pages: write         # GitHub Pages への書き込み
  id-token: write      # デプロイ認証用トークン

# ─── 同時実行制御 ───
# 複数の push が連続した場合、最新の1つだけ実行する
concurrency:
  group: 'pages'
  cancel-in-progress: true
```

### ビルドジョブの解説

```yaml
jobs:
  build:
    runs-on: ubuntu-latest    # Ubuntu の仮想マシンで実行

    steps:
      # ① リポジトリのコードをチェックアウト（ダウンロード）
      - name: Checkout
        uses: actions/checkout@v4

      # ② Node.js v20 をインストール + npm キャッシュを有効化
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'          # package-lock.json を基にキャッシュ

      # ③ 依存関係をインストール
      #    npm ci は npm install より厳密（lockfile に完全一致）
      - name: Install dependencies
        run: npm ci

      # ④ Next.js ビルド → out/ に静的ファイルが生成される
      - name: Build
        run: npm run build

      # ⑤ out/ ディレクトリをアーティファクトとしてアップロード
      #    次の deploy ジョブで使用するため
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
```

### デプロイジョブの解説

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: build              # build ジョブの完了を待ってから実行

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}    # デプロイ先 URL

    steps:
      # ⑥ アップロードされたアーティファクトを GitHub Pages にデプロイ
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### ワークフロー全体の流れ

```
release ブランチに push
    ↓
[build ジョブ]
    ① actions/checkout@v4       → コードを取得
    ② actions/setup-node@v4     → Node.js をセットアップ
    ③ npm ci                    → 依存関係をインストール
    ④ npm run build             → out/ に静的ファイルを生成
    ⑤ upload-pages-artifact@v3  → out/ をアーティファクトとして保存
    ↓
[deploy ジョブ]（build 完了後に実行）
    ⑥ deploy-pages@v4           → GitHub Pages にデプロイ
    ↓
https://CGLkousei.github.io/githubpagesSample/ で公開！
```

---

## 3. release ブランチの運用

### ブランチ戦略

```
main ブランチ     → 開発用（最新のコード）
release ブランチ  → 公開用（push すると自動デプロイ）
```

### 使い方

```bash
# 開発は main ブランチで行う
git checkout main
# ... コードを編集 ...
git add .
git commit -m "新機能を追加"
git push origin main

# 公開したいタイミングで release に反映
git checkout release
git merge main
git push origin release    # ← これで自動的に GitHub Pages が更新される
```

---

## 4. GitHub リポジトリ側の設定（手動）

GitHub の Web UI で以下の設定が必要：

1. リポジトリの **Settings** タブを開く
2. 左メニューの **Pages** をクリック
3. **Source** を **「GitHub Actions」** に変更する

> ※ デフォルトでは「Deploy from a branch」になっているため、必ず変更すること。

---

## 5. 使用した GitHub Actions アクション一覧

| アクション | バージョン | 役割 |
|---|---|---|
| `actions/checkout` | v4 | リポジトリのコードを取得 |
| `actions/setup-node` | v4 | Node.js のインストールとキャッシュ |
| `actions/upload-pages-artifact` | v3 | ビルド成果物を Pages 用にアップロード |
| `actions/deploy-pages` | v4 | GitHub Pages にデプロイ |

---

## まとめ

| やったこと | ファイル | 目的 |
|---|---|---|
| Static Export 設定 | `next.config.ts` | Next.js を HTML/CSS/JS に変換 |
| GitHub Actions 作成 | `.github/workflows/deploy.yml` | サーバー側で自動ビルド＆デプロイ |
| release ブランチ作成 | - | 公開トリガー用のブランチ |
| GitHub Pages 設定 | GitHub Web UI | Source を「GitHub Actions」に変更 |
