-- 自由入力ラベルを許可するためにCHECK制約を削除し、長さ制約を追加
ALTER TABLE training_samples DROP CONSTRAINT IF EXISTS training_samples_label_check;
ALTER TABLE training_samples ADD CONSTRAINT training_samples_label_check CHECK (label ~ '^[A-Z_]{1,5}$' OR label IN ('DOG','NOT_DOG'));
