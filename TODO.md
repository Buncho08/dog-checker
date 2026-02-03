# Next.js App Router移行 TODO（TDD版・簡潔）

## 方針（t-wada TDD）

- Red → Green → Refactor を各タスクで厳守
- TODOは「成果物」「完了条件」を中心に記載

---

## Phase 0: テスト環境

- [ ] 移行前の古いディレクトリ（src/routes, src/app.ts などのExpress実装）は使用禁止。新規実装は Next.js App Router / app/api 配下に限定すること。

- [x] Vitest/RTL/Playwrightの導入
- [x] テスト共通セットアップの用意
- [ ] CIでテストが走る状態にする

完了条件: `npm run test` と `npm run test:e2e` が空プロジェクトで通る

---

## Phase 1: Next.js基盤

- [x] Next.js（App Router）導入
- [x] ディレクトリ構成の確定（app/, lib/, tests/）
- [x] npm scriptsの更新

完了条件: `npm run dev` でトップページが表示される

---

## Phase 2: コアロジック移行（TDD）

- [x] `similarity` を移行
- [x] `config` を移行
- [x] `validators` を実装

完了条件: ユニットテストがGreen

---

## Phase 3: DB移行（TDD）

- [x] Vercel Postgres導入
- [x] スキーマ作成とマイグレーション
- [x] DB操作（insert/fetch/stats）を移行

完了条件: DB関連の統合テストがGreen ✅

---

## Phase 4: ストレージ移行（TDD）

- [x] Vercel Blob導入
- [x] 画像アップロード/削除の実装

完了条件: ストレージ関連テストがGreen

---

## Phase 5: 埋め込み（TDD）

- [x] Dummy埋め込み移行
- [x] ONNX埋め込み移行
- [x] Embedding Factory実装

完了条件: 埋め込み関連テストがGreen

---

## Phase 6: API Routes（TDD）

- [x] learn / predict / stats / samples / animal
- [x] エラーハンドリング共通化

完了条件: APIテストがGreen

---

## Phase 7: フロントエンド（TDD）

- [x] 主要ページ（/ /check /samples）
- [x] 主要コンポーネント

完了条件: UIテストがGreen

---

## Phase 8: E2E

- [x] 学習フロー
- [x] 予測フロー
- [x] 主要エラーケース

完了条件: E2EがGreen

---

## Phase 9: デプロイ準備

- [x] .env.example整理
- [x] next.config/vercel.json整理
- [x] セキュリティ/パフォーマンス確認

完了条件: `npm run build` がGreen ✅

---

## Phase 10: Vercelデプロイ

- [ ] Previewデプロイ
- [ ] Prodデプロイ
- [ ] スモークテスト

完了条件: 本番URLで主要機能が動作

**デプロイ手順**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) を参照
