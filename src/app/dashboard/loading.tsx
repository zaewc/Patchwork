import { SiteHeader } from "@/components/site-header";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Block className="h-7 w-40" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-18.5" />
          ))}
        </div>
        <Block className="mt-10 h-40" />
        <Block className="mt-10 h-56" />
      </main>
    </>
  );
}
