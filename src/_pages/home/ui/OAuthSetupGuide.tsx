import type { Dictionary } from "@/shared/lib/i18n";

const Code = ({ children }: { children: string }) => (
  <code className="font-mono text-xs">{children}</code>
);

/** OAuth 앱이 아직 없을 때 대신 보여주는 준비 절차 */
export function OAuthSetupGuide({ dict }: { dict: Dictionary }) {
  const { setup } = dict.home;

  return (
    <ol className="mt-8 w-full list-decimal space-y-1.5 rounded-xl border border-border bg-surface p-5 pl-9 text-left text-sm text-muted">
      <li>{setup.step1}</li>
      <li>
        {setup.step2.before}
        <Code>http://localhost:3000/api/auth/callback</Code>
        {setup.step2.after}
      </li>
      <li>
        {setup.step3.before}
        <Code>.env.example</Code>
        {setup.step3.middle}
        <Code>.env.local</Code>
        {setup.step3.after}
      </li>
    </ol>
  );
}
