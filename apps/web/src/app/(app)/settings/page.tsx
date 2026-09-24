import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/settings/account-panel";
import { GeneralPanel } from "@/components/settings/general-panel";
import { NotificationChannelsPanel } from "@/components/settings/notification-channels-panel";
import { ProvidersPanel } from "@/components/settings/providers-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface GeneralSettings {
  siteName: string;
  defaultCurrency: string;
  timezone: string;
}

const DEFAULT_GENERAL: GeneralSettings = { siteName: "CarWatch", defaultCurrency: "EUR", timezone: "Europe/Ljubljana" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [providers, channels, generalSetting] = await Promise.all([
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
    prisma.notificationChannel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.appSetting.findUnique({ where: { key: "general" } }),
  ]);

  const general = { ...DEFAULT_GENERAL, ...((generalSetting?.value as Partial<GeneralSettings>) ?? {}) };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="text-sm text-fg-muted">Providers, notifications, and account preferences.</p>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <ProvidersPanel providers={providers} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationChannelsPanel channels={channels} />
        </TabsContent>

        <TabsContent value="account">
          <AccountPanel email={user.email} name={user.name} />
        </TabsContent>

        <TabsContent value="general">
          <GeneralPanel initial={general} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
