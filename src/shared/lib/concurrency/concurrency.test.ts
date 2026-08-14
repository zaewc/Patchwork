import { describe, expect, it } from "vitest";
import { mapInBatches } from "@/shared/lib/concurrency/concurrency";

describe("mapInBatches", () => {
  it("입력 순서대로 결과를 준다", async () => {
    const doubled = await mapInBatches([1, 2, 3, 4, 5], 2, (n) => Promise.resolve(n * 2));
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });

  it("빈 목록은 빈 결과다", async () => {
    expect(await mapInBatches([], 4, (n) => Promise.resolve(n))).toEqual([]);
  });

  it("한 번에 limit개까지만 함께 실행한다", async () => {
    let running = 0;
    let peak = 0;

    await mapInBatches(Array.from({ length: 10 }, (_, i) => i), 3, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await Promise.resolve();
      running--;
      return n;
    });

    expect(peak).toBe(3);
  });

  it("항목이 limit보다 적으면 한 번에 끝낸다", async () => {
    let peak = 0;
    let running = 0;

    await mapInBatches([1, 2], 8, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await Promise.resolve();
      running--;
      return n;
    });

    expect(peak).toBe(2);
  });

  it("하나가 실패하면 그대로 올린다", async () => {
    await expect(
      mapInBatches([1, 2, 3], 2, (n) => {
        if (n === 2) return Promise.reject(new Error("두 번째 실패"));
        return Promise.resolve(n);
      }),
    ).rejects.toThrow("두 번째 실패");
  });
});
