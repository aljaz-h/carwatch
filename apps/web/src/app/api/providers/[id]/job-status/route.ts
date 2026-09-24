import { getCurrentUser } from "@/lib/auth";
import { getJobStatus } from "@/lib/provider-diagnostics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return Response.json({ error: "Missing jobId" }, { status: 400 });

  const status = await getJobStatus(jobId);
  return Response.json({ job: status });
}
