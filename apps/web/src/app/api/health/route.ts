import { prisma } from "@carwatch/database";
import { getCurrentUser } from "@/lib/auth";
import { queueClients } from "@/lib/queue-client";
import { getAppVersion } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * Public, dependency-free liveness check for the Docker healthcheck and load
 * balancers: "is the web process serving requests". Deliberately does NOT
 * touch the database or Redis — a transient DB blip shouldn't make Docker
 * decide the whole container is unhealthy and restart it.
 *
 * Authenticated callers can additionally request `?deep=1` to also verify
 * the database and Redis are reachable, for the admin-facing settings page.
 * This never runs for anonymous requests, so it can't be used to probe
 * internal infrastructure from outside.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";

  const { version, gitSha } = getAppVersion();

  if (!deep) {
    return Response.json({ status: "ok", version });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ status: "ok", version });
  }

  const [database, redis] = await Promise.all([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    queueClients.connection
      .ping()
      .then((r) => r === "PONG")
      .catch(() => false),
  ]);

  const status = database && redis ? "ok" : "degraded";
  return Response.json({
    status,
    version,
    gitSha,
    dependencies: { database: database ? "ok" : "error", redis: redis ? "ok" : "error" },
  });
}
