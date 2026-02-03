# Dog Checker API

Node.js 20 LTS で動作する画像分類API（DOG/NOT_DOG判定）のMVP実装。機械学習の再学習は行わず、固定の埋め込みベクトル抽出 + kNN近傍検索で推論します。

## 特徴

- **学習API**: 画像とラベル（DOG/NOT_DOG）を受け取り、埋め込みベクトル化してSQLiteに保存
- **推論API**: 画像を受け取り、kNN近傍検索でラベルを予測（DOG/NOT_DOG/UNKNOWN）
- **統計API**: 学習済みデータ件数を取得
- **Phase 0**: ダミー埋め込み（SHA-256ベース、128次元）で動作確認済み
- **Phase 1**: ONNX Runtime Web + MobileNetV2（ImageNet事前学習済み、特徴ベクトル抽出）に切り替え可能
- **Vercel対応**: WASMベースのためサーバーレス環境でも動作

## Phase 1への移行（ONNX Runtime Web）

### 1. 依存インストール

```bash
npm install onnxruntime-web sharp
npm install -D @types/sharp
# WASMファイルは自動的にpublic/wasm/にコピーされます（postinstallフック）
```

### 2. モデルファイル準備

```bash
mkdir -p data/models
cd data/models
wget https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-10.onnx
cd ../..
```

### 3. ONNX有効化

`.env` で `USE_ONNX=true` に変更し、サーバー再起動。

```bash
# .env
USE_ONNX=true
```

埋め込み出力はモデルの出力名から自動選択されます。特徴出力があるモデルの利用を推奨し、
必要に応じて `EMBEDDING_OUTPUT_NAME` で出力名を明示してください。

## セットアップ

```bash
# 依存インストール
npm install

# 環境変数設定（必要なら編集）
cp .env.example .env

# 開発サーバー起動
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

## 環境変数（.env）

```
PORT=3000                # APIサーバーのポート
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require  # Neon接続文字列
K=5                      # kNNの近傍数
THRESHOLD=0.25           # UNKNOWN判定の類似度閾値
USE_ONNX=false           # true: ONNX (MobileNetV2), false: ダミー埋め込み
EMBEDDING_OUTPUT_NAME=   # 任意: 埋め込み出力のテンソル名（モデルに合わせて指定）
ALLOWED_ORIGINS=*        # CORS許可オリジン（本番環境では特定のドメインを指定）
UNSPLASH_ACCESS_KEY=     # Unsplash API Key（動物画像取得用、オプション）
```

## Vercelデプロイ

### 事前準備

1. **環境変数の設定**
   Vercelダッシュボードで以下を設定：
   - `DATABASE_URL`: Vercel Postgresの接続文字列
   - `USE_ONNX`: `true`（ONNX使用時）
   - `ALLOWED_ORIGINS`: 本番ドメイン（例：`https://yourdomain.com`）
   - `UNSPLASH_ACCESS_KEY`: Unsplash APIキー（オプション）

2. **ONNX Runtime Webの対応**
   - ✅ WASMベースのためVercel Serverless Functionsでネイティブに動作
   - 本番環境で`USE_ONNX=true`を設定可能
   - モデルファイル（mobilenetv2-10.onnx、約14MB）を`data/models/`に配置
   - 初回起動時にWASMランタイムが初期化されます

3. **タイムアウト設定**
   - 無料プランは10秒制限
   - Pro/Enterpriseプランで`vercel.json`の`maxDuration: 30`が有効

### セキュリティの注意事項

- **画像サイズ制限**: 最大10MB
- **SSRF対策**: 外部画像取得はHTTPSのみ、プライベートIP拒否
- **CORS**: 本番環境では`ALLOWED_ORIGINS`を特定ドメインに設定
- **レート制限**: 高トラフィック時はUpstash Redisなどでレート制限を実装推奨
- **サンプル数**: 10万件超過時は応答時間が遅延する可能性あり

### デプロイコマンド

```bash
# Vercel CLIでデプロイ
npm install -g vercel
vercel
```

## API仕様

### POST /api/learn

画像とラベルを受け取り、学習データとして保存します。

```bash
curl -F "image=@./image/dog.png" -F "label=DOG" http://localhost:3000/api/learn
# {"id":"uuid","label":"DOG","embedderVersion":"dummy-v1"}

curl -F "image=@./image/cat.png" -F "label=NOT_DOG" http://localhost:3000/api/learn
# {"id":"uuid","label":"NOT_DOG","embedderVersion":"dummy-v1"}
```

- **Request**: `multipart/form-data`
  - `image` (file): 画像ファイル
  - `label` (string): `DOG` または `NOT_DOG`
- **Response**: `{ id: string, label: string, embedderVersion: string }`

### POST /api/predict

画像を受け取り、kNN近傍検索でラベルを予測します。

```bash
curl -F "image=@./image/test.png" http://localhost:3000/api/predict
# {"label":"DOG","score":0.95,"neighbors":[...],"embedderVersion":"dummy-v1","sampleCount":10}
```

- **Request**: `multipart/form-data`
  - `image` (file): 画像ファイル
- **Response**: `{ label: "DOG"|"NOT_DOG"|"UNKNOWN", score: number, neighbors: Array<{id,label,sim}>, embedderVersion: string, sampleCount: number }`
  - `score`: 最も類似度が高い近傍とのcosine類似度（0〜1、高いほど類似）

**UNKNOWN判定条件**:

- 同一embedderVersionの学習データが0件
- 最大類似度 < THRESHOLD（デフォルト0.25）
- DOGとNOT_DOGの票数が同数

### GET /api/stats

学習済みデータの統計情報を取得します。

```bash
curl http://localhost:3000/api/stats
# {"dogCount":3,"notDogCount":2,"total":5}
```

- **Response**: `{ dogCount: number, notDogCount: number, total: number }`

## データリセット

学習データをリセットする場合は、Postgresでテーブルを空にしてください。

```sql
TRUNCATE TABLE training_samples;
```

## テスト実行

```bash
npm test
```

## npm scripts

- `npm run dev`: 開発サーバー起動（ファイル変更時に自動再起動）
- `npm run build`: TypeScriptをJSにコンパイル（dist/へ出力）
- `npm start`: ビルド済みJSを実行（本番用）
- `npm test`: Jest単体テスト実行

## ディレクトリ構成

```
src/
  server.ts              # Express起動・ルーティング
  config.ts              # 環境変数読み込み
  db.ts                  # SQLite接続・スキーマ・CRUD
  embedding/
    embedder.ts          # 画像埋め込み生成（Phase 0: ダミー実装）
  utils/
    similarity.ts        # cosine類似度 + kNN実装
  routes/
    learn.ts             # POST /api/learn
    predict.ts           # POST /api/predict
    stats.ts             # GET /api/stats
tests/
  similarity.test.ts     # kNN/cosineの単体テスト
```

## 設計方針

- **最小構成**: レイヤー分けを最小限に、DIコンテナ/Repository抽象/DDD等は使用しない
- **型安全**: TypeScript strict mode、any禁止
- **拡張性**: embedder層を分離し、将来ONNX実装へ差し替え可能
- **シンプル**: 1ファイル200行以内、エラー処理は最低限（400/500）

# dog_checker
# dog-checker
