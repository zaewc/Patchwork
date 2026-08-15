import { describe, expect, it } from "vitest";
import { filterByScope } from "@/features/contribution-scope/lib/filterByScope";
import { NOTABLE_MIN } from "@/entities/repo";

const items = [
  { id: "notable", impact: 100 },
  { id: "boundary", impact: NOTABLE_MIN },
  { id: "below", impact: NOTABLE_MIN - 1 },
  { id: "none", impact: 0 },
];

describe("filterByScope", () => {
  it("주요 OSS 모드에서는 기준선 위만 남긴다", () => {
    expect(filterByScope(items, false).map((item) => item.id)).toEqual([
      "notable",
      "boundary",
    ]);
  });

  it("전체 모드에서는 그대로 둔다", () => {
    expect(filterByScope(items, true)).toBe(items);
  });

  it("빈 목록도 다룬다", () => {
    expect(filterByScope([], false)).toEqual([]);
  });
});
