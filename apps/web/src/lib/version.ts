/**
 * Baked into the production image at build time (see the `runner` stage in
 * apps/web/Dockerfile: ARG/ENV CARWATCH_VERSION, CARWATCH_GIT_SHA) from the
 * GHCR-publishing workflow. Unset in local dev, where these fall back to
 * values that make it obvious this isn't a released build.
 */
export interface AppVersion {
  version: string;
  gitSha: string;
}

export function getAppVersion(): AppVersion {
  return {
    version: process.env.CARWATCH_VERSION ?? "development",
    gitSha: process.env.CARWATCH_GIT_SHA ?? "unknown",
  };
}
