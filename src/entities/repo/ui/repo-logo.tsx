export function RepoLogo({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-sm bg-surface-2"
      style={{ width: size, height: size }}
    />
  );
}
