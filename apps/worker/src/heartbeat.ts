import { writeFile } from "node:fs/promises";

const HEARTBEAT_PATH = process.env.HEARTBEAT_FILE ?? "/tmp/carwatch-worker-heartbeat";
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Touches a heartbeat file every 30s so the Docker healthcheck (which has no
 * HTTP endpoint to poll, unlike the web container) can tell a live worker
 * apart from one that's hung or crashed without an exit.
 */
export function startHeartbeat(): NodeJS.Timeout {
  const tick = () => {
    writeFile(HEARTBEAT_PATH, String(Date.now())).catch(() => {
      // Best-effort only — a failure to write the heartbeat file shouldn't crash the worker.
    });
  };
  tick();
  return setInterval(tick, HEARTBEAT_INTERVAL_MS);
}
