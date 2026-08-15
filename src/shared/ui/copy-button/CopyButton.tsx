"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/shared/ui/icon";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "복사됨" : "Markdown 복사"}
    </button>
  );
}
