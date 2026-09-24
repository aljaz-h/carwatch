import { getCurrentUser } from "@/lib/auth";
import { getProviderDiagnostics } from "@/lib/provider-diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const providers = await getProviderDiagnostics();
  return Response.json({ providers });
}
