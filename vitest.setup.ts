import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement, type ImgHTMLAttributes } from "react";
import { afterEach, vi } from "vitest";

/**
 * 요청 밖에서는 `next/headers`가 던진다. 화면 문구의 언어를 요청에서 읽는 코드가
 * 여러 레이어에 있으므로, 아무 단서도 없는 요청을 기본으로 깔아 둔다.
 * 그러면 어느 테스트든 기본 언어(한국어)로 그려진다.
 *
 * 언어나 세션을 직접 다루는 테스트는 파일 안에서 다시 `vi.mock` 해 덮어쓴다.
 */
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
  headers: () => Promise.resolve({ get: () => null }),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) =>
    createElement("img", props),
}));

afterEach(cleanup);
