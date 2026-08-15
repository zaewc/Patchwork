import Link from "next/link";

export type Tab<T> = {
  href: string;
  label: string;
  active: boolean;
  value: T;
};

export type InPlace<T> = {
  select: (value: T) => void;
  prefetch: (value: T) => void;
};

export function TabBar<T>({
  items,
  inPlace,
}: {
  items: Tab<T>[];
  inPlace?: InPlace<T>;
}) {
  return (
    <nav className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          aria-current={item.active ? "page" : undefined}
          {...(inPlace
            ? {
                onClick: (event: React.MouseEvent) => {
                  event.preventDefault();
                  inPlace.select(item.value);
                },
                onPointerEnter: () => inPlace.prefetch(item.value),
              }
            : {})}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            item.active
              ? "bg-accent-soft font-medium text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
