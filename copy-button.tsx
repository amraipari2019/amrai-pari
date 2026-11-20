"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard unavailable: number stays selectable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-sm font-medium text-primary hover:bg-muted"
    >
      {done ? (
        <Check className="size-4 text-secondary" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      <span aria-live="polite">{done ? copiedLabel : label}</span>
    </button>
  );
}
