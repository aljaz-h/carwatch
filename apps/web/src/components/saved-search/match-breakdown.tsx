import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Check {
  key: string;
  label: string;
  passed: boolean;
}

export function MatchBreakdown({ score, requiredChecks, preferredChecks }: { score: number; requiredChecks: Check[]; preferredChecks: Check[] }) {
  const scoreColor = score >= 90 ? "text-success" : score >= 70 ? "text-accent" : "text-warning";

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-sm font-semibold", scoreColor)}>{score}% match</p>
      <ul className="flex flex-col gap-1">
        {[...requiredChecks, ...preferredChecks].map((c) => (
          <li key={c.key} className="flex items-center gap-1.5 text-xs">
            {c.passed ? <Check className="h-3 w-3 shrink-0 text-success" /> : <X className="h-3 w-3 shrink-0 text-fg-subtle" />}
            <span className={c.passed ? "text-fg-muted" : "text-fg-subtle"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
