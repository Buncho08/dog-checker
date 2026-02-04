-- 日本語を含む自由入力ラベルを許可するよう制約を変更
ALTER TABLE training_samples DROP CONSTRAINT IF EXISTS training_samples_label_check;
ALTER TABLE training_samples ADD CONSTRAINT training_samples_label_check CHECK (
  label IN ('DOG','NOT_DOG') OR 
  (char_length(label) >= 1 AND char_length(label) <= 5)
);
