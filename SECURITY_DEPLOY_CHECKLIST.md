# セキュリティ & デプロイチェックリスト

## ✅ 完了した修正

### セキュリティ

- [x] **SSRF脆弱性の修正** ([animal/image/route.ts](app/api/animal/image/route.ts))
  - HTTPSのみ許可
  - localhost, プライベートIP（10.x, 172.16-31.x, 192.168.x）をブロック
  - AWS メタデータエンドポイント（169.254.x）をブロック

- [x] **DoS対策: 画像サイズ制限** (全アップロードAPI)
  - 最大10MBに制限
  - [learn/route.ts](app/api/learn/route.ts)
  - [predict/route.ts](app/api/predict/route.ts)

- [x] **DoS対策: サンプル数警告**
  - 10万件超過時に警告ログを出力
  - [predict/route.ts](app/api/predict/route.ts)

- [x] **CORS設定の環境変数化** (全APIルート)
  - `ALLOWED_ORIGINS`環境変数で制御
  - デフォルトは`*`、本番では特定ドメインを推奨

- [x] **Unsplash API Keyの環境変数化**
  - ハードコードを削除
  - [animalsApi.ts](lib/animalsApi.ts)

- [x] **DATABASE_URLの検証**
  - PostgreSQL接続文字列の形式チェック
  - [db.ts](lib/db.ts)

### アルゴリズム

- [x] **MobileNetV2画像前処理の修正**
  - アスペクト比を維持したリサイズに変更
  - [embedder.ts](lib/embedding/embedder.ts)

- [x] **Temperature最小値の引き上げ**
  - 1e-6 → 0.01（数値安定性向上）
  - [decideLabel.ts](lib/utils/decideLabel.ts)

### デプロイ設定

- [x] **onnxruntime-webへの切り替え**
  - onnxruntime-nodeからonnxruntime-webに移行
  - WASMベースでVercel Serverless Functionsで動作
  - [package.json](package.json), [embedder.ts](lib/embedding/embedder.ts)

- [x] **vercel.json作成**
  - Node.js 20指定
  - タイムアウト30秒設定（predict/learn/evaluate）

- [x] **.node-version作成**
  - Node.js 20指定

- [x] **next.config.js更新**
  - onnxruntime-web用のwebpack設定
  - サーバーサイドでのfallback設定

- [x] **.dockerignore作成**
  - 不要ファイルの除外

- [x] **.env.example更新**
  - 新しい環境変数を追加

- [x] **READMEの更新**
  - Vercelデプロイ手順
  - セキュリティ注意事項
  - onnxruntime-webへの移行を反映

## ⚠️ Vercelデプロイ前に設定すべき環境変数

```bash
# 必須
DATABASE_URL="postgres://..."  # Vercel Postgresの接続文字列

# セキュリティ（本番環境では必須）
ALLOWED_ORIGINS="https://yourdomain.com"

# オプション（機能による）
USE_ONNX="true"  # 本番でも"true"設定可能（onnxruntime-webで動作）
UNSPLASH_ACCESS_KEY="your_key"  # 動物画像API使用時
K="5"
THRESHOLD="0.25"
```

## ✅ Vercelデプロイ時の対応済み事項

### onnxruntime-webへの移行

**解決済み**: `onnxruntime-web`（WASMベース）に切り替えたため、Vercel Serverless Functionsでネイティブに動作します。

**変更内容**:

- ✅ `onnxruntime-node` → `onnxruntime-web`に依存関係を変更
- ✅ WASMバックエンドを使用する設定を追加
- ✅ Next.jsのwebpack設定を最適化

**メリット**:

- ネイティブバイナリ依存がなくなり、どの環境でも動作
- Vercelデプロイ時にビルドエラーが発生しない
- メモリ使用量がより効率的

**注意点**:

- 初回実行時にWASMランタイムの初期化が必要（数秒）
- モデルファイル（約14MB）をデプロイパッケージに含める必要あり

## ⚠️ Vercelデプロイ時の残存する制約

### タイムアウト制限

- **無料プラン**: 10秒
- **Pro/Enterprise**: `vercel.json`で最大30秒設定済み
- ONNX推論 + kNN検索で10秒を超える可能性あり

### メモリ制限

- **無料プラン**: 1024MB
- `sharp` + `onnxruntime` + 大量サンプルで不足する可能性

## 📊 テスト結果

```
✓ tests/similarity.test.ts (1 test)
✓ tests/decideLabel.test.ts (4 tests)
✓ tests/validators.test.ts (3 tests)
✓ tests/embedding.test.ts (2 tests)
✓ tests/db.test.ts (1 test)
✓ tests/app.test.tsx (1 test)

Test Files  6 passed (6)
     Tests  12 passed (12)
```

## 🚀 デプロイ手順

```bash
# 1. Vercel CLIインストール（未インストールの場合）
npm install -g vercel

# 2. プロジェクトルートでログイン
vercel login

# 3. デプロイ（初回）
vercel

# 4. 環境変数を設定（Vercelダッシュボードまたは CLI）
vercel env add DATABASE_URL
vercel env add ALLOWED_ORIGINS
# ... その他必要な環境変数

# 5. 本番デプロイ
vercel --prod
```

## 📝 本番運用後の推奨対応

- [ ] レート制限の実装（Upstash Redis等）
- [ ] 監視・アラート設定（Vercel Analytics, Sentry等）
- [ ] 古いサンプル削除機能の実装
- [ ] 近似近傍探索の導入（サンプル数が多い場合）
- [ ] APIドキュメント（OpenAPI/Swagger）の作成
