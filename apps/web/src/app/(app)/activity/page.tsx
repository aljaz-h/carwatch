import { Bell } from "lucide-react";
import { redirect } from "next/navigation";
import { AlertEventRow } from "@/components/activity/alert-event-row";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getRecentAlertEvents } from "@/lib/query-activity";

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await getRecentAlertEvents(user.id);

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Activity</h1>
        <p className="text-sm text-fg-muted">Every alert CarWatch has sent you.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Bell} title="No activity yet" description="Alerts from saved searches and your watchlist will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <AlertEventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
