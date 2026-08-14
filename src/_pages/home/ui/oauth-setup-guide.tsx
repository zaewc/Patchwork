const Code = ({ children }: { children: string }) => (
  <code className="font-mono text-xs">{children}</code>
);

/** OAuth 앱이 아직 없을 때 대신 보여주는 준비 절차 */
export function OAuthSetupGuide() {
  return (
    <ol className="mt-8 w-full list-decimal space-y-1.5 rounded-xl border border-border bg-surface p-5 pl-9 text-left text-sm text-muted">
      <li>GitHub → Settings → Developer settings → OAuth Apps 에서 앱을 만듭니다.</li>
      <li>
        Authorization callback URL 을{" "}
        <Code>http://localhost:3000/api/auth/callback</Code> 으로 지정합니다.
      </li>
      <li>
        <Code>.env.example</Code> 을 <Code>.env.local</Code> 로 복사해 값을 채웁니다.
      </li>
    </ol>
  );
}
