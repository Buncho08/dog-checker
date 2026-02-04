-- 学習サンプルへの投票機能を追加
CREATE TABLE IF NOT EXISTS sample_votes (
  id SERIAL PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES training_samples(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  voter_id TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 同じユーザーが同じサンプルに複数回投票できないようにする
CREATE UNIQUE INDEX IF NOT EXISTS idx_sample_votes_unique ON sample_votes(sample_id, voter_id);

-- sample_idで投票を効率的に取得
CREATE INDEX IF NOT EXISTS idx_sample_votes_sample_id ON sample_votes(sample_id);
