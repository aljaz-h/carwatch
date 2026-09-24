/**
 * Shared between the plain-HTTP and Playwright-based fetch mechanisms so a
 * provider looks the same regardless of which one it uses.
 */
export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
export const DEFAULT_ACCEPT_LANGUAGE = "sl-SI,sl;q=0.9,en-US;q=0.8,en;q=0.7";
export const DEFAULT_LOCALE = "sl-SI";
