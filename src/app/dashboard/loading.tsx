import { SiteHeader } from "@/components/site-header";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Block className="h-9 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Block key={i} className="h-[86px]" />
          ))}
        </div>
        <Block className="mt-10 h-40" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-56" />
          ))}
        </div>
      </main>
    </>
  );
}
