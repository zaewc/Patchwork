/**
 * 한 번에 limit개까지만 동시에 실행한다. 결과 순서는 입력 순서와 같다.
 * 남의 API를 100개씩 동시에 두드리지 않기 위한 것이다.
 */
export async function mapInBatches<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += limit) {
    results.push(...(await Promise.all(items.slice(index, index + limit).map(run))));
  }
  return results;
}
