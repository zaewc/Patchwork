const TONES = {
  warn: "border-warn/40 bg-warn/10 text-warn",
  danger: "border-danger/40 bg-danger/10 text-danger",
} as const;

export function Banner({
  tone = "warn",
  className = "",
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`rounded-lg border px-4 py-2.5 text-sm ${TONES[tone]} ${className}`}>{children}</p>
  );
}
