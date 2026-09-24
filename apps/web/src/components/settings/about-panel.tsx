import type { AppVersion } from "@/lib/version";

export function AboutPanel({ version, gitSha }: AppVersion) {
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-fg">About</h3>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Version</dt>
          <dd className="font-mono text-fg">{version}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Commit</dt>
          <dd className="font-mono text-fg">{gitSha}</dd>
        </div>
      </dl>
      <p className="text-xs text-fg-subtle">
        The web and worker containers are pinned to the same <code>CARWATCH_VERSION</code>, so they always run this same
        release together.
      </p>
    </div>
  );
}
