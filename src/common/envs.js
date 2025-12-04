// @ts-check

/**
 * 動態獲取 whitelist
 * 這樣可以在 Cloudflare Workers 環境中正確工作
 * @returns {string[] | undefined} Whitelist array or undefined
 */
const getWhitelist = () => {
  if (!globalThis.process?.env?.WHITELIST) {
    return undefined;
  }
  return process.env.WHITELIST.split(",");
};

/**
 * 動態獲取 gist whitelist
 * @returns {string[] | undefined} Gist whitelist array or undefined
 */
const getGistWhitelist = () => {
  if (!globalThis.process?.env?.GIST_WHITELIST) {
    return undefined;
  }
  return process.env.GIST_WHITELIST.split(",");
};

/**
 * 動態獲取 exclude repositories
 * @returns {string[]} Exclude repositories array
 */
const getExcludeRepositories = () => {
  if (!globalThis.process?.env?.EXCLUDE_REPO) {
    return [];
  }
  return process.env.EXCLUDE_REPO.split(",");
};

// 為了向後兼容,提供 getter 屬性
const whitelist = {
  get value() {
    return getWhitelist();
  },
};

const gistWhitelist = {
  get value() {
    return getGistWhitelist();
  },
};

const excludeRepositories = {
  get value() {
    return getExcludeRepositories();
  },
};

export {
  whitelist,
  gistWhitelist,
  excludeRepositories,
  getWhitelist,
  getGistWhitelist,
  getExcludeRepositories,
};
