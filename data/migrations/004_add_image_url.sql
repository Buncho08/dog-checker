-- 画像URLカラムを追加 (本番環境に影響しない安全な追加)
-- IF NOT EXISTS を使用することで、既に列が存在する場合はエラーにならない
ALTER TABLE training_samples ADD COLUMN IF NOT EXISTS image_url TEXT;

-- インデックスは不要（検索には使わないため）
