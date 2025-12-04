// @ts-check

import { CustomError } from "./error.js";
import { logger } from "./log.js";

/**
 * 動態計算可用的 GitHub API tokens 數量
 * 這樣可以在 Cloudflare Workers 環境中正確工作
 * @returns {number} 可用的 PAT 數量
 */
const getPATsCount = () => {
  if (!globalThis.process || !globalThis.process.env) {
    return 0;
  }
  return Object.keys(process.env).filter((key) => /PAT_\d*$/.exec(key)).length;
};

/**
 * 獲取重試次數
 * @returns {number} 重試次數
 */
const getRetries = () => {
  const PATs = getPATsCount();
  return process.env.NODE_ENV === "test" ? 7 : PATs;
};

/**
 * @typedef {import("axios").AxiosResponse} AxiosResponse Axios response.
 * @typedef {(variables: any, token: string, retriesForTests?: number) => Promise<AxiosResponse>} FetcherFunction Fetcher function.
 */

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * @param {FetcherFunction} fetcher The fetcher function.
 * @param {any} variables Object with arguments to pass to the fetcher function.
 * @param {number} retries How many times to retry.
 * @returns {Promise<any>} The response from the fetcher function.
 */
const retryer = async (fetcher, variables, retries = 0) => {
  const RETRIES = getRetries();

  if (!RETRIES) {
    throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
  }

  if (retries > RETRIES) {
    throw new CustomError(
      "Downtime due to GitHub API rate limiting",
      CustomError.MAX_RETRY,
    );
  }

  try {
    // try to fetch with the first token since RETRIES is 0 index i'm adding +1
    let response = await fetcher(
      variables,
      // @ts-ignore
      process.env[`PAT_${retries + 1}`],
      // used in tests for faking rate limit
      retries,
    );

    // react on both type and message-based rate-limit signals.
    // https://github.com/anuraghazra/github-readme-stats/issues/4425
    const errors = response?.data?.errors;
    const errorType = errors?.[0]?.type;
    const errorMsg = errors?.[0]?.message || "";
    const isRateLimited =
      (errors && errorType === "RATE_LIMITED") || /rate limit/i.test(errorMsg);

    // if rate limit is hit increase the RETRIES and recursively call the retryer
    // with username, and current RETRIES
    if (isRateLimited) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      // directly return from the function
      return retryer(fetcher, variables, retries);
    }

    // finally return the response
    return response;
  } catch (err) {
    /** @type {any} */
    const e = err;

    // network/unexpected error → let caller treat as failure
    if (!e?.response) {
      throw e;
    }

    // prettier-ignore
    // also checking for bad credentials if any tokens gets invalidated
    const isBadCredential =
      e?.response?.data?.message === "Bad credentials";
    const isAccountSuspended =
      e?.response?.data?.message === "Sorry. Your account was suspended.";

    if (isBadCredential || isAccountSuspended) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      // directly return from the function
      return retryer(fetcher, variables, retries);
    }

    // HTTP error with a response → return it for caller-side handling
    return e.response;
  }
};

export { retryer, getRetries };
export default retryer;
