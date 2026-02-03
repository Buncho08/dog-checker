#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"

learn() {
	local file="$1"
	local label="$2"
	curl -s -F "image=@${file}" -F "label=${label}" "${BASE_URL}/api/learn" > /dev/null
}

predict_label() {
	local file="$1"
	if [[ ! -f "$file" ]]; then
		echo "MISSING_FILE"
		return
	fi
	local resp
	resp=$(curl -sS -F "image=@${file}" "${BASE_URL}/api/predict" || true)
	if [[ -z "$resp" ]]; then
		echo "NO_RESPONSE"
		return
	fi
	python3 - << 'PY' "$resp"
import json, sys
raw = sys.argv[1]
try:
    data = json.loads(raw)
    print(data.get("label", "UNKNOWN"))
except json.JSONDecodeError:
    print("BAD_JSON")
PY
}

expected_label() {
	local file="$1"
	local name
	name=$(basename "$file")
	if [[ "$name" == *"not_dog"* ]]; then
		echo "NOT_DOG"
	else
		echo "DOG"
	fi
}

echo "[1/3] 学習データ投入"
learn "./image/learnData/dog.png" "DOG"
learn "./image/learnData/dog2.png" "DOG"
learn "./image/learnData/dog3.png" "DOG"
learn "./image/learnData/dog4.png" "DOG"
learn "./image/learnData/dog5.png" "DOG"
learn "./image/learnData/dog6.png" "DOG"
learn "./image/learnData/not_dog.png" "NOT_DOG"
learn "./image/learnData/not_dog2.png" "NOT_DOG"
learn "./image/learnData/not_dog3.png" "NOT_DOG"
learn "./image/learnData/not_dog4.png" "NOT_DOG"
learn "./image/learnData/not_dog5.png" "NOT_DOG"
learn "./image/learnData/not_dog6.png" "NOT_DOG"

echo "[2/3] 学習件数"
curl -s "${BASE_URL}/api/stats" | python3 -m json.tool

echo "[3/3] 推論テスト"
printf "%-24s %-10s %-10s %-6s\n" "FILE" "PRED" "EXPECT" "OK?"
printf "%-24s %-10s %-10s %-6s\n" "------------------------" "----------" "----------" "-----"

for file in \
	./image/preData/dog.png \
	./image/preData/dog2.png \
	./image/preData/dog3.png \
	./image/preData/not_dog.png \
	./image/preData/not_dog2.png \
	./image/preData/not_dog3.png \
	./image/preData/not_dog4.png \
	./image/preData/not_dog5.png; do
	pred=$(predict_label "$file")
	expect=$(expected_label "$file")
	ok="NG"
	if [[ "$pred" == "$expect" ]]; then
		ok="OK"
	fi
	printf "%-24s %-10s %-10s %-6s\n" "$(basename "$file")" "$pred" "$expect" "$ok"
done