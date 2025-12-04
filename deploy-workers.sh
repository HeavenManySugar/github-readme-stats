#!/bin/bash

# Cloudflare Workers 快速部署腳本

set -e

echo "🚀 GitHub Readme Stats - Cloudflare Workers 部署工具"
echo "=================================================="
echo ""

# 檢查是否已安裝 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 找不到 Node.js"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

# 檢查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  警告: Node.js 版本過低 (當前: $(node -v))"
    echo "建議使用 Node.js 22 或更高版本"
fi

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴套件..."
    npm install
    echo "✅ 依賴安裝完成"
    echo ""
fi

# 選單
echo "請選擇操作:"
echo "1) 登入 Cloudflare"
echo "2) 設定 GitHub Token (PAT_1)"
echo "3) 本地開發測試"
echo "4) 部署到 Cloudflare Workers"
echo "5) 查看即時日誌"
echo "6) 完整設定 (首次使用)"
echo "0) 離開"
echo ""
read -p "請輸入選項 [0-6]: " choice

case $choice in
    1)
        echo "🔐 正在開啟登入頁面..."
        npx wrangler login
        ;;
    2)
        echo "🔑 設定 GitHub Personal Access Token"
        echo "請前往: https://github.com/settings/tokens"
        echo "建立新 token 並選擇權限: public_repo, read:user"
        echo ""
        npx wrangler secret put PAT_1
        echo "✅ Token 設定完成"
        ;;
    3)
        echo "💻 啟動本地開發伺服器..."
        echo "伺服器將運行在 http://localhost:8787"
        echo "測試範例:"
        echo "  curl 'http://localhost:8787/api?username=anuraghazra'"
        echo ""
        npm run workers:dev
        ;;
    4)
        echo "🚀 部署到 Cloudflare Workers..."
        npm run workers:deploy
        echo ""
        echo "✅ 部署完成!"
        echo "你的 Worker URL 已顯示在上方"
        ;;
    5)
        echo "📊 啟動即時日誌監控..."
        echo "按 Ctrl+C 停止"
        echo ""
        npm run workers:tail
        ;;
    6)
        echo "🎯 開始完整設定流程..."
        echo ""
        
        echo "步驟 1/3: 登入 Cloudflare"
        npx wrangler login
        echo ""
        
        echo "步驟 2/3: 設定 GitHub Token"
        echo "請前往: https://github.com/settings/tokens"
        echo "建立新 token 並選擇權限: public_repo, read:user"
        echo ""
        npx wrangler secret put PAT_1
        echo ""
        
        echo "步驟 3/3: 部署 Worker"
        npm run workers:deploy
        echo ""
        
        echo "✅ 所有設定完成!"
        echo "你可以使用上方顯示的 URL 來存取你的 GitHub Stats"
        ;;
    0)
        echo "👋 再見!"
        exit 0
        ;;
    *)
        echo "❌ 無效的選項"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "✨ 完成!"
