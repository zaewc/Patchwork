import Image from "next/image";

export function RepoLogo({
  src,
  alt,
  size = 16,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image
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
