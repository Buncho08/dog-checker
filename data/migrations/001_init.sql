CREATE TABLE IF NOT EXISTS training_samples (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL CHECK (label IN ('DOG','NOT_DOG')),
  embedding JSONB NOT NULL,
  embedder_version TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_samples_label ON training_samples(label);
CREATE INDEX IF NOT EXISTS idx_training_samples_version ON training_samples(embedder_version);