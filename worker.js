// Cloudflare Workers 主入口檔案

/**
 * 初始化全域 process.env
 * 必須在 import 其他模組之前執行
 */
if (!globalThis.process) {
  globalThis.process = { env: {} };
}
if (!globalThis.process.env) {
  globalThis.process.env = {};
}

import { createVercelAdapter } from "./src/workers/adapter.js";
import statsCard from "./api/index.js";
import repoCard from "./api/pin.js";
import langCard from "./api/top-langs.js";
import wakatimeCard from "./api/wakatime.js";
import gistCard from "./api/gist.js";

/**
 * 路由處理器
 * @param {Request} request
 * @param {Object} env - Cloudflare Workers 環境變數
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  let path = url.pathname;

  // 移除尾隨斜線(除了根路徑)
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // 在每次請求時更新環境變數
  if (env) {
    Object.keys(env).forEach((key) => {
      globalThis.process.env[key] = env[key];
    });
  }

  // 路由映射
  const routes = {
    "/": statsCard,
    "/api": statsCard,
    "/api/": statsCard,
    "/api/pin": repoCard,
    "/api/top-langs": langCard,
    "/api/wakatime": wakatimeCard,
    "/api/gist": gistCard,
  };

  // 尋找匹配的路由
  const handler = routes[path];

  if (handler) {
    try {
      // 使用適配器將 Cloudflare Workers Request 轉換為 Vercel 格式
      const adapter = createVercelAdapter(request, env);
      await handler(adapter.req, adapter.res);
      return adapter.getResponse();
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120">
          <text x="10" y="30" font-family="monospace" font-size="14" fill="#ff0000">
            Error: ${error.message || "Internal server error"}
          </text>
        </svg>`,
        {
          status: 500,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
    }
  }

  // 根路徑重導向到 GitHub repo
  if (path === "/") {
    return Response.redirect(
      "https://github.com/anuraghazra/github-readme-stats",
      301,
    );
  }

  // 404 錯誤
  return new Response("Not Found", { status: 404 });
}

export default {
  /**
   * Cloudflare Workers fetch handler
   * @param {Request} request
   * @param {Object} env
   * @param {Object} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
