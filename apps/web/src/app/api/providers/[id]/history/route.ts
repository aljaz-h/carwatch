import { getCurrentUser } from "@/lib/auth";
import { getProviderRunHistory } from "@/lib/provider-diagnostics";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["all", "success", "failed", "partial"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: providerKey } = await params;
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "all";
  const status = VALID_STATUS.has(statusParam) ? (statusParam as "all" | "success" | "failed" | "partial") : "all";
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const result = await getProviderRunHistory(providerKey, { status, cursor });
  if (!result) return Response.json({ error: "Unknown provider" }, { status: 404 });

  return Response.json(result);
}
