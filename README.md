# Dog Checker API

Node.js 20 LTS で動作する画像分類API（DOG/NOT_DOG判定）
固定の埋め込みベクトル抽出 + kNN近傍検索で推論します。

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

