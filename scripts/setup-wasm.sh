#!/bin/bash
# ONNX Runtime Web のWASMファイルをpublicディレクトリにコピー

set -e

echo "Setting up ONNX Runtime Web WASM files..."

# publicディレクトリ作成
mkdir -p public/wasm

# WASMファイルをコピー
if [ -d "node_modules/onnxruntime-web/dist" ]; then
    cp node_modules/onnxruntime-web/dist/*.wasm public/wasm/
    cp node_modules/onnxruntime-web/dist/*.mjs public/wasm/ 2>/dev/null || true
    cp node_modules/onnxruntime-web/dist/*.js public/wasm/ 2>/dev/null || true
    echo "✓ WASM and JS files copied to public/wasm/"
    ls -lh public/wasm/ | wc -l
    echo "files copied"
else
    echo "✗ onnxruntime-web not found. Please run: npm install"
    exit 1
fi

echo "Setup complete!"
