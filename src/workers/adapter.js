// @ts-check
/**
 * 適配器:將 Cloudflare Workers Request/Response 轉換為 Vercel 的 req/res 格式
 */

/**
 * 模擬 Vercel 的 ServerResponse 物件
 */
class VercelResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
    this.sent = false;
  }

  /**
   * 設定 HTTP header
   * @param {string} key Header name.
   * @param {string} value Header value.
   */
  setHeader(key, value) {
    this.headers[key] = value;
  }

  /**
   * 取得 HTTP header
   * @param {string} key Header name.
   * @returns {string | undefined} Header value.
   */
  getHeader(key) {
    return this.headers[key];
  }

  /**
   * 設定狀態碼
   * @param {number} code HTTP status code.
   * @returns {this} This response object for chaining.
   */
  status(code) {
    this.statusCode = code;
    return this;
  }

  /**
   * 發送回應
   * @param {string | Buffer} data Response data.
   * @returns {this} This response object for chaining.
   */
  send(data) {
    this.body = data;
    this.sent = true;
    return this;
  }

  /**
   * 發送 JSON 回應
   * @param {any} data JSON data.
   * @returns {this} This response object for chaining.
   */
  json(data) {
    this.setHeader("Content-Type", "application/json");
    this.body = JSON.stringify(data);
    this.sent = true;
    return this;
  }

  /**
   * 重導向
   * @param {number | string} statusOrUrl Status code or URL.
   * @param {string} [url] URL if first param is status code.
   * @returns {this} This response object for chaining.
   */
  redirect(statusOrUrl, url) {
    if (typeof statusOrUrl === "string") {
      this.statusCode = 302;
      this.setHeader("Location", statusOrUrl);
    } else {
      this.statusCode = statusOrUrl;
      this.setHeader("Location", url);
    }
    this.sent = true;
    return this;
  }
}

/**
 * 模擬 Vercel 的 IncomingMessage 物件
 */
class VercelRequest {
  /**
   * @param {Request} request - Cloudflare Workers Request
   */
  constructor(request) {
    const url = new URL(request.url);

    // 解析 query parameters
    this.query = {};
    url.searchParams.forEach((value, key) => {
      this.query[key] = value;
    });

    this.method = request.method;
    this.url = url.pathname + url.search;
    this.headers = {};

    // 轉換 Headers 物件為普通物件
    request.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });

    this._request = request;
  }

  /**
   * 取得 header
   * @param {string} name Header name.
   * @returns {string | undefined} Header value.
   */
  header(name) {
    return this.headers[name.toLowerCase()];
  }
}

/**
 * 創建 Vercel 適配器
 * @param {Request} request - Cloudflare Workers Request
 * @param {Object} env - Cloudflare Workers 環境變數
 * @returns {{ req: VercelRequest, res: VercelResponse, getResponse: () => Response }} Adapter object with req, res, and getResponse function.
 */
export function createVercelAdapter(request, env) {
  const req = new VercelRequest(request);
  const res = new VercelResponse();

  // 將環境變數注入到 process.env (用於現有程式碼)
  if (!globalThis.process) {
    globalThis.process = { env: {} };
  }
  if (!globalThis.process.env) {
    globalThis.process.env = {};
  }

  // 複製環境變數,確保覆蓋而不是僅添加
  if (env) {
    Object.keys(env).forEach((key) => {
      globalThis.process.env[key] = env[key];
    });
  }

  /**
   * 將 VercelResponse 轉換為 Cloudflare Workers Response
   * @returns {Response} Cloudflare Workers Response object.
   */
  function getResponse() {
    // 如果沒有發送回應,返回 500 錯誤
    if (!res.sent) {
      return new Response("Internal Server Error: No response sent", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const headers = new Headers();
    Object.entries(res.headers).forEach(([key, value]) => {
      headers.set(key, String(value));
    });

    return new Response(res.body, {
      status: res.statusCode,
      headers,
    });
  }

  return { req, res, getResponse };
}
