# Vercel デプロイガイド

## 🔐 最終セキュリティチェック（済）

### ✅ 完了項目

1. **認証・認可**
   - ✅ セッションベース認証実装（JWT）
   - ✅ ミドルウェアで全ページを保護
   - ✅ AUTH_SECRET 環境変数で暗号化
   - ✅ 本番環境では secure cookie 有効化

2. **SSRF対策**
   - ✅ 外部画像取得はHTTPSのみ許可
   - ✅ localhost、プライベートIP、AWSメタデータエンドポイントをブロック
   - ✅ [animal/image/route.ts](app/api/animal/image/route.ts#L18-L31)

3. **DoS対策**
   - ✅ 画像サイズ最大10MBに制限
   - ✅ 10万サンプル超過時に警告ログ
   - ✅ タイムアウト設定（30秒）

4. **CORS設定**
   - ✅ ALLOWED_ORIGINS環境変数で制御
   - ✅ 本番環境では特定ドメインに設定推奨

5. **機密情報**
   - ✅ 環境変数化完了（AUTH_SECRET、AUTH_PASSWORD、DATABASE_URL）
   - ✅ .env.example更新済み
   - ✅ ハードコードされた機密情報なし

6. **コード品質**
   - ✅ 本番環境に不要な console.log 削除
   - ✅ 全ユニットテストパス（24/24）
   - ✅ ビルドエラーなし

---

## 📋 デプロイ前チェックリスト

### 1. ローカル環境でのテスト

```bash
# 全テストを実行
npm test

# ビルドを確認
npm run build

# 本番モードで起動テスト
npm start
```

すべて成功することを確認してください。

### 2. 環境変数の準備

以下の環境変数を準備してください：

#### 必須項目

```bash
# データベース（Vercel Postgresで自動生成）
DATABASE_URL=postgres://...

# 認証（32文字以上の強力なランダム文字列を生成）
AUTH_SECRET=<openssl rand -base64 32 で生成>
AUTH_PASSWORD=<強力なパスワード>

# セキュリティ（本番ドメインを指定）
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

#### オプション項目

```bash
# ONNX推論を使用する場合
USE_ONNX=true

# kNNパラメータ（デフォルト値で問題なければ不要）
K=5
THRESHOLD=0.25

# Unsplash API（動物画像取得機能を使う場合）
UNSPLASH_ACCESS_KEY=your_key_here
```

---

## 🚀 Vercelデプロイ手順

### ステップ1: Vercel CLIのインストール

```bash
npm install -g vercel
```

### ステップ2: Vercelにログイン

```bash
vercel login
```

ブラウザが開き、GitHubまたはメールでログインします。

### ステップ3: プロジェクトをリンク

プロジェクトディレクトリで以下を実行：

```bash
vercel
```

初回実行時の質問に答えます：

```
? Set up and deploy "~/workspaces"? [Y/n] Y
? Which scope do you want to deploy to? <your-account>
? Link to existing project? [y/N] N
? What's your project's name? dog-checker
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### ステップ4: Vercel Postgresをセットアップ

1. Vercelダッシュボードにアクセス: https://vercel.com/dashboard
2. プロジェクト「dog-checker」を選択
3. 「Storage」タブ → 「Create Database」
4. 「Postgres」を選択
5. データベース名を入力（例: dog-checker-db）
6. リージョンを選択（推奨: ユーザーに近い場所）
7. 「Create」をクリック

データベースが作成されると、`DATABASE_URL`などの環境変数が自動的にプロジェクトに追加されます。

### ステップ5: マイグレーションを実行

```bash
# ローカルから本番DBにマイグレーション実行
# まず、.envに本番のDATABASE_URLを一時的に設定
vercel env pull .env.local

# マイグレーション実行
DATABASE_URL="<本番DB URL>" node scripts/migrate.js
```

または、Vercel上で直接実行：

1. Vercelダッシュボード → プロジェクト → 「Settings」 → 「Functions」
2. 「Source」タブで `scripts/migrate.js` を一時的なAPI Routeとして実行

### ステップ6: 環境変数を設定

Vercelダッシュボードで環境変数を設定：

1. プロジェクト → 「Settings」 → 「Environment Variables」
2. 以下を追加：

```
# 必須
AUTH_SECRET = <openssl rand -base64 32 で生成した値>
AUTH_PASSWORD = <強力なパスワード>
ALLOWED_ORIGINS = https://dog-checker.vercel.app

# オプション
USE_ONNX = true
UNSPLASH_ACCESS_KEY = <your_key>
K = 5
THRESHOLD = 0.25
```

**重要**:

- `DATABASE_URL` はVercel Postgresで自動設定されます
- すべての環境で同じ値を使う場合は「Production, Preview, Development」すべてにチェック
- 環境ごとに異なる値を使う場合は個別に設定

### ステップ7: 本番デプロイ

```bash
vercel --prod
```

デプロイが完了すると、本番URLが表示されます：

```
✅ Production: https://dog-checker.vercel.app
```

### ステップ8: 動作確認

1. **ログインページ**: `https://your-app.vercel.app/login`
   - AUTH_PASSWORDで設定したパスワードでログイン

2. **ホームページ**: `https://your-app.vercel.app/`
   - ランダム画像が表示されることを確認
   - 「いぬ」「いぬじゃない」ボタンで学習できることを確認

3. **判定ページ**: `https://your-app.vercel.app/check`
   - 画像アップロードして判定できることを確認

4. **サンプル一覧**: `https://your-app.vercel.app/samples`
   - 学習データが表示されることを確認

5. **API動作確認**:

   ```bash
   # セッションCookieを取得してからAPIをテスト
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"password":"your_password"}' \
     -c cookies.txt

   # 統計取得
   curl https://your-app.vercel.app/api/stats \
     -b cookies.txt
   ```

---

## 🔧 トラブルシューティング

### ビルドエラー

**症状**: デプロイ時にビルドエラー

**解決策**:

```bash
# ローカルでビルドを確認
npm run build

# node_modulesをクリーンインストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### データベース接続エラー

**症状**: `DATABASE_URL is not set` エラー

**解決策**:

1. Vercel Postgresが正しくリンクされているか確認
2. 環境変数 `DATABASE_URL` が設定されているか確認
3. 設定後、再デプロイ: `vercel --prod`

### ONNX実行エラー

**症状**: `/api/predict` や `/api/learn` でタイムアウト

**解決策**:

1. `vercel.json` のタイムアウト設定を確認（30秒に設定済み）
2. 無料プランの場合は10秒制限があるため、Proプランにアップグレード
3. または `USE_ONNX=false` でダミー埋め込みに切り替え

### CORS エラー

**症状**: ブラウザコンソールに CORS エラー

**解決策**:

1. `ALLOWED_ORIGINS` を正しいドメインに設定
2. 複数ドメインの場合はカンマ区切りで設定
   ```
   ALLOWED_ORIGINS=https://app1.vercel.app,https://app2.vercel.app
   ```

### ミドルウェアで無限リダイレクト

**症状**: `/login` にアクセスできない

**解決策**:

1. `AUTH_SECRET` が設定されているか確認
2. ブラウザのCookieをクリア
3. シークレットモードで再試行

---

## 📊 本番環境の監視

### ログの確認

Vercelダッシュボード → プロジェクト → 「Logs」タブで以下を監視：

- **エラーログ**: 500エラー、例外
- **警告ログ**: サンプル数超過など
- **パフォーマンス**: 各APIの実行時間

### アラート設定（推奨）

1. Vercel Integrations で Slack/Discord連携
2. エラー率が閾値を超えたら通知
3. データベース接続エラーを即座に検知

---

## 🔄 継続的デプロイ

### GitHubと連携（推奨）

1. GitHubリポジトリを作成
2. コードをプッシュ
3. Vercelダッシュボード → 「Import Project」
4. GitHubリポジトリを選択
5. 環境変数を設定

**以降、mainブランチへのプッシュで自動デプロイ**

```bash
git add .
git commit -m "Update feature"
git push origin main
# → 自動的にVercelにデプロイされます
```

---

## 🛡️ セキュリティベストプラクティス

### 定期的なチェック

- [ ] 環境変数が漏洩していないか（GitHubなど）
- [ ] 依存パッケージの脆弱性スキャン: `npm audit`
- [ ] ログに機密情報が含まれていないか
- [ ] CORS設定が適切か
- [ ] セッションタイムアウトが適切か（デフォルト24時間）

### 推奨設定

1. **レート制限の追加**（高トラフィック時）
   - Upstash Redisを使用
   - `/api/predict` などに制限を追加

2. **画像の検証強化**
   - MIMEタイプチェック
   - ファイル拡張子検証
   - マルウェアスキャン（高セキュリティ要件の場合）

3. **監査ログ**
   - 学習/予測のログを保存
   - 異常なアクセスパターンを検知

---

## 📞 サポート

問題が発生した場合：

1. [Vercel Documentation](https://vercel.com/docs)
2. [Next.js Documentation](https://nextjs.org/docs)
3. プロジェクトのIssueトラッカー

---

**デプロイ完了後、このガイドをチームと共有してください！** 🎉
