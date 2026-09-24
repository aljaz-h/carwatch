import { redirect } from "next/navigation";
import { NavBar } from "@/components/layout/nav-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col">
        <NavBar user={{ name: user.name, email: user.email }} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </TooltipProvider>
  );
}
