import type { ReactNode } from "react";

type IconProps = {
  /** 곁들이는 글자보다 살짝 큰 14px가 기본이다. */
  size?: number;
  className?: string;
};

/**
 * 아이콘 공통 뼈대. 선 굵기와 격자(24×24)를 한 곳에서 정해 아이콘끼리 두께가 어긋나지 않게 한다.
 * 글자 색을 그대로 따르고, 뜻은 옆의 글자가 이미 말하므로 스크린 리더에는 감춘다.
 */
function Icon({
  size = 14,
  className = "",
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

/** 돌아가는 두 화살표. 다시 불러오기. */
export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.6-4.2" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.6 4.2" />
      <polyline points="19.6 3.2 19.6 7.2 15.6 7.2" />
      <polyline points="4.4 20.8 4.4 16.8 8.4 16.8" />
    </Icon>
  );
}

/** 문에서 화살표가 빠져나가는 모양. 나가기. */
export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  );
}

/** 겹쳐 놓은 종이 두 장. 복사. */
export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

/** 아래를 가리키는 꺾쇠. 펼치면 더 있다. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

/** 체크 표시. 방금 끝난 일. */
export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

/** 빛살이 뻗는 해. 밝게. */
export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M17.7 17.7l1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.3 17.7l-1.4 1.4" />
      <path d="M19.1 4.9l-1.4 1.4" />
    </Icon>
  );
}

/** 이지러진 달. 어둡게. */
export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </Icon>
  );
}

/** 받침 달린 화면. 운영체제 설정을 따른다. */
export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  );
}
