import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUser } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  if (!(await hasAnyUser())) redirect("/setup");
  redirect("/login");
}
