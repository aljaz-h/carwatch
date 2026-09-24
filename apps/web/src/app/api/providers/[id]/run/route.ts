import { getCurrentUser } from "@/lib/auth";
import { enqueueManualProviderRun } from "@/lib/provider-diagnostics";

export const dynamic = "force-dynamic";

// The [id] segment is the provider's `key` (e.g. "avto_net") — every
// provider diagnostics route addresses providers by key, not database id,
// since that's what both the UI and the worker already use everywhere else.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: providerKey } = await params;
  const result = await enqueueManualProviderRun(providerKey);

  if (!result.ok) {
    return Response.json({ ok: false, message: result.message }, { status: 409 });
  }
  return Response.json({ ok: true, jobId: result.jobId });
}
