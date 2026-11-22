/**
 * Query key chuẩn của một tài nguyên: `[module, resource, ...]`. Invalidate `all` là làm mới cả tài nguyên.
 *
 * ```ts
 * export const shortLinkKeys = createResourceKeys("utilities", "short-links");
 * useQuery({ queryKey: shortLinkKeys.list(filters), ... });
 * ```
 *
 * @param module - Mã module FE.
 * @param resource - Tên tài nguyên.
 * @returns Bộ khóa.
 */
export function createResourceKeys(module: string, resource: string) {
  const all = [module, resource] as const;
  return {
    all,
    lists: () => [...all, "list"] as const,
    list: (filters: object) => [...all, "list", filters] as const,
    options: (filters: object = {}) => [...all, "options", filters] as const,
    detail: (id: string) => [...all, "detail", id] as const,
    history: (id: string) => [...all, "history", id] as const,
  };
}

export type ResourceKeys = ReturnType<typeof createResourceKeys>;
