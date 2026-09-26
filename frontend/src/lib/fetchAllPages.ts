const CONCURRENCY = 4;

export type PageFetcher<T> = (
  page: number,
  limit: number,
) => Promise<{ items: T[]; totalPages: number }>;

export type ProgressFn = (done: number, total: number) => void;

async function fetchPages<T>(
  pages: number[],
  limit: number,
  fetchPage: PageFetcher<T>,
  onProgress?: ProgressFn,
  alreadyDone = 0,
): Promise<T[][]> {
  const total = pages.length + alreadyDone;
  const out: T[][] = [];
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      pages
        .slice(i, i + CONCURRENCY)
        .map((p) => fetchPage(p, limit).then((r) => r.items)),
    );
    out.push(...batch);
    onProgress?.(alreadyDone + out.length, total);
  }
  return out;
}

export async function fetchAllPages<T>(
  fetchPage: PageFetcher<T>,
  limit: number,
  onProgress?: ProgressFn,
): Promise<T[]> {
  const first = await fetchPage(1, limit);
  onProgress?.(1, first.totalPages);
  const restPages = Array.from(
    { length: Math.max(0, first.totalPages - 1) },
    (_, i) => i + 2,
  );
  const rest = await fetchPages(restPages, limit, fetchPage, onProgress, 1);
  return [first.items, ...rest].flat();
}

/** Rows [start, end) of the list, fetched in `limit`-sized chunks and sliced. */
export async function fetchRowRange<T>(
  fetchPage: PageFetcher<T>,
  start: number,
  end: number,
  limit: number,
  onProgress?: ProgressFn,
): Promise<T[]> {
  if (end <= start) return [];
  const firstPage = Math.floor(start / limit) + 1;
  const lastPage = Math.floor((end - 1) / limit) + 1;
  const pages = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, i) => firstPage + i,
  );
  const rows = (await fetchPages(pages, limit, fetchPage, onProgress)).flat();
  const offset = start - (firstPage - 1) * limit;
  return rows.slice(offset, offset + (end - start));
}
