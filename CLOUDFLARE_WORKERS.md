# Cloudflare Workers 部署指南

這個專案已經適配為可以在 Cloudflare Workers 上執行。以下是設定和部署的完整指南。

## 📋 前置需求

1. Node.js 22 或更高版本
2. npm 或 yarn 套件管理器
3. Cloudflare 帳號 (免費方案即可)
4. GitHub Personal Access Token (PAT)

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

這會自動安裝 `wrangler` CLI 工具 (Cloudflare Workers 的開發工具)。

### 2. 登入 Cloudflare

```bash
npm run workers:login
```

或直接使用:

```bash
npx wrangler login
```

這會開啟瀏覽器讓你授權 wrangler 存取你的 Cloudflare 帳號。

### 3. 設定環境變數

你需要設定 GitHub Personal Access Token 作為 secret:

```bash
# 設定主要 token
npx wrangler secret put PAT_1

# 設定備用 token (選用,用於 rate limit 時切換)
npx wrangler secret put PAT_2
```

執行指令後會提示你輸入 token 值。

#### 如何獲得 GitHub Personal Access Token:

1. 前往 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 點擊 "Generate new token (classic)"
3. 選擇以下權限:
   - `public_repo` - 存取公開 repositories
   - `read:user` - 讀取使用者資料
4. 生成並複製 token

### 4. 本地開發測試

```bash
npm run workers:dev
```

這會啟動本地開發伺服器,預設在 `http://localhost:8787`。

測試範例:
```bash
# 測試基本 stats card
curl "http://localhost:8787/api?username=anuraghazra"

# 測試 top languages card
curl "http://localhost:8787/api/top-langs?username=anuraghazra"

# 測試 repo pin card
curl "http://localhost:8787/api/pin?username=anuraghazra&repo=github-readme-stats"
```

### 5. 部署到 Cloudflare Workers

```bash
npm run workers:deploy
```

部署成功後,你會得到一個 URL,例如:
```
https://github-readme-stats.<your-subdomain>.workers.dev
```

## 📝 使用方式

部署後,你可以使用以下 URL 格式:

```markdown
<!-- Stats Card -->
![GitHub Stats](https://github-readme-stats.<your-subdomain>.workers.dev/api?username=你的GitHub用戶名)

<!-- Top Languages Card -->
![Top Languages](https://github-readme-stats.<your-subdomain>.workers.dev/api/top-langs?username=你的GitHub用戶名)

<!-- Repo Pin Card -->
![Repo Card](https://github-readme-stats.<your-subdomain>.workers.dev/api/pin?username=你的GitHub用戶名&repo=倉庫名稱)

<!-- Wakatime Card -->
![Wakatime Stats](https://github-readme-stats.<your-subdomain>.workers.dev/api/wakatime?username=你的Wakatime用戶名)

<!-- Gist Card -->
![Gist Card](https://github-readme-stats.<your-subdomain>.workers.dev/api/gist?id=你的Gist_ID)
```

## ⚙️ 配置選項

### wrangler.toml

主要配置檔案在 `wrangler.toml`,你可以修改:

- `name`: Workers 的名稱
- `compatibility_date`: 相容性日期
- `vars`: 環境變數 (非敏感資訊)

### 多環境部署

如果你想要有不同環境 (staging, production):

```bash
# 部署到 staging
npx wrangler deploy --env staging

# 部署到 production
npx wrangler deploy --env production
```

## 🔍 監控和除錯

### 查看即時日誌

```bash
npm run workers:tail
```

這會顯示 Worker 的即時執行日誌,包括錯誤和 console.log 輸出。

### 檢查部署狀態

前往 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages 查看:
- 請求數量
- 錯誤率
- CPU 使用時間
- 成功率

## 📊 免費方案限制

Cloudflare Workers 免費方案包含:
- ✅ 每天 100,000 次請求
- ✅ 每次請求最多 10ms CPU 時間
- ✅ 128 MB 記憶體
- ✅ 無限個 Workers

對於個人使用的 GitHub readme stats,免費方案通常足夠。

## 🔧 進階配置

### 自訂網域

如果你想使用自己的網域:

1. 在 Cloudflare 中添加你的網域
2. 在 `wrangler.toml` 中添加 routes 配置:

```toml
[[routes]]
pattern = "stats.yourdomain.com/*"
zone_name = "yourdomain.com"
```

3. 重新部署:

```bash
npm run workers:deploy
```

### 效能優化

- 使用 Cloudflare 的全球 CDN,自動選擇最近的資料中心
- 設定適當的快取標頭 (已在程式碼中實作)
- 考慮使用 Cloudflare KV 進行額外快取 (進階)

## 🆚 與 Vercel 的差異

| 功能 | Vercel | Cloudflare Workers |
|------|--------|-------------------|
| 免費請求數 | 100 GB 頻寬/月 | 100,000 次/天 |
| 冷啟動時間 | 較慢 | 極快 (0ms) |
| 執行環境 | Node.js | V8 isolates |
| 全球分發 | ✅ | ✅ |
| 自訂網域 | ✅ | ✅ |
| 價格 | 較高 | 較低 |

## 🐛 疑難排解

### 問題: "Error: No PAT_1 found"

**解決方案**: 確保已設定 GitHub token:
```bash
npx wrangler secret put PAT_1
```

### 問題: "Error: Module not found"

**解決方案**: 確保所有依賴都已安裝:
```bash
npm install
```

### 問題: Rate limit exceeded

**解決方案**: 
1. 設定多個 GitHub tokens (PAT_1, PAT_2, ...)
2. 增加快取時間
3. 升級到 GitHub Pro 取得更高的 API rate limit

### 問題: Worker 部署失敗

**解決方案**:
1. 檢查 `wrangler.toml` 配置是否正確
2. 確認已登入 Cloudflare: `npm run workers:login`
3. 查看詳細錯誤訊息並修正

## 📚 相關資源

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub API 文檔](https://docs.github.com/en/graphql)
- [原始專案](https://github.com/anuraghazra/github-readme-stats)

## 🤝 貢獻

如果你發現問題或有改進建議,歡迎提交 issue 或 pull request。

## 📄 授權

MIT License - 與原始專案相同
