interface ProviderErrorDetailProps {
  userMessage: string;
  errorTypeLabel: string | null;
  httpStatus: number | null;
  jobId: string | null;
  technicalDetail: string | null;
  timestamp: string;
}

export function ProviderErrorDetail({ userMessage, errorTypeLabel, httpStatus, jobId, technicalDetail, timestamp }: ProviderErrorDetailProps) {
  const hasAdvanced = errorTypeLabel || httpStatus || jobId || technicalDetail;

  return (
    <div className="rounded-md border border-danger/25 bg-danger-muted/40 p-3">
      <p className="text-sm text-fg">{userMessage}</p>

      {hasAdvanced && (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-fg-subtle hover:text-fg-muted [&::-webkit-details-marker]:hidden">
            Advanced details
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-fg-subtle">
            {errorTypeLabel && (
              <>
                <dt className="font-medium">Type</dt>
                <dd className="font-mono">{errorTypeLabel}</dd>
              </>
            )}
            {httpStatus && (
              <>
                <dt className="font-medium">HTTP status</dt>
                <dd className="font-mono">{httpStatus}</dd>
              </>
            )}
            {jobId && (
              <>
                <dt className="font-medium">Job ID</dt>
                <dd className="font-mono">{jobId}</dd>
              </>
            )}
            <dt className="font-medium">Timestamp</dt>
            <dd className="font-mono">{new Date(timestamp).toLocaleString("en-GB")}</dd>
            {technicalDetail && (
              <>
                <dt className="font-medium">Detail</dt>
                <dd className="break-all font-mono">{technicalDetail}</dd>
              </>
            )}
          </dl>
        </details>
      )}
    </div>
  );
}
