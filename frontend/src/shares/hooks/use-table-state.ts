"use client";

import { useSearchParams } from "next/navigation";

import { clampSearchQuery } from "@/shares/lib/search-text";

/** Số dòng mỗi trang mặc định của mọi bảng. */
export const DEFAULT_PAGE_SIZE = 20;

type TableUrlState = { search: string; page: number; pageSize: number; ordering?: string };

/**
 * Đọc state bảng từ query string (`search`, `page`, `pageSize`, `ordering`).
 *
 * @param params - Query string hiện tại.
 * @param defaults - Giá trị mặc định.
 * @returns State đã chuẩn hoá.
 */
export function readTableUrlState(
  params: URLSearchParams,
  defaults: { pageSize: number; ordering?: string },
): TableUrlState {
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const pageSize = Number.parseInt(params.get("pageSize") ?? "", 10);
  return {
    search: clampSearchQuery(params.get("search") ?? ""),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : defaults.pageSize,
    ordering: params.get("ordering") || defaults.ordering,
  };
}

/**
 * Ghi state bảng vào query string, bỏ các giá trị mặc định để URL gọn.
 *
 * @param state - State bảng.
 * @param defaults - Giá trị mặc định.
 * @returns Query string (không có `?`).
 */
export function writeTableUrlState(
  state: TableUrlState,
  defaults: { pageSize: number; ordering?: string },
  baseParams = new URLSearchParams(),
): string {
  const params = new URLSearchParams(baseParams);
  const assign = (key: string, value: string | undefined) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  assign("search", state.search.trim() || undefined);
  assign("page", state.page > 1 ? String(state.page) : undefined);
  assign("pageSize", state.pageSize !== defaults.pageSize ? String(state.pageSize) : undefined);
  assign("ordering", state.ordering !== defaults.ordering ? state.ordering : undefined);
  return params.toString();
}

/**
 * Tách giá trị bộ lọc chọn nhiều trong URL (`a,b`) thành mảng, bỏ trống và trùng.
 *
 * @param raw - Giá trị trên URL.
 * @returns Danh sách giá trị.
 */
export function parseFilterValues(raw: string | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((item) => item.trim()))].filter(Boolean);
}

/**
 * Lọc danh sách giá trị theo tập cho phép (giá trị lạ trên URL bị bỏ).
 *
 * @param values - Giá trị đọc từ URL.
 * @param allowed - Giá trị hợp lệ.
 * @returns Giá trị hợp lệ, hoặc `undefined` khi không còn gì (không lọc).
 */
export function pickAllowedValues<V extends string>(
  values: readonly string[],
  allowed: readonly V[],
): V[] | undefined {
  const picked = values.filter((value): value is V =>
    (allowed as readonly string[]).includes(value),
  );
  return picked.length ? picked : undefined;
}

/**
 * State chuẩn của một bảng có tìm kiếm + sắp xếp + phân trang phía server, đồng bộ lên URL
 * (tải lại trang hay gửi link vẫn giữ trang, từ khóa, sắp xếp). Đổi từ khóa, sắp xếp hay số dòng
 * mỗi trang thì về trang 1. SearchInput chỉ đưa từ khóa đã `trim` vào state khi nhấn Enter.
 *
 * @param options - `pageSize` (mặc định 20) và `ordering` mặc định.
 * @returns Bộ lọc gửi API (`filters`) và prop sẵn cho `DataTable`.
 */
export function useTableState<K extends string = never>({
  pageSize: defaultPageSize = DEFAULT_PAGE_SIZE,
  ordering: defaultOrdering,
  filterKeys = [],
}: { pageSize?: number; ordering?: string; filterKeys?: readonly K[] } = {}) {
  const searchParams = useSearchParams();
  const defaults = { pageSize: defaultPageSize, ordering: defaultOrdering };
  const state = readTableUrlState(new URLSearchParams(searchParams.toString()), defaults);
  const extraFilters = Object.fromEntries(
    filterKeys.map((key) => [key, searchParams.get(key) || undefined]),
  ) as Record<K, string | undefined>;
  const keyword = state.search.trim();

  // Đọc URL mới nhất để các bộ lọc ghép qua slot không ghi đè state của nhau.
  const update = (
    patch: Partial<TableUrlState>,
    filters: Record<string, string | undefined> = {},
  ) => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...readTableUrlState(params, defaults), ...patch };
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = writeTableUrlState(next, defaults, params);
    // Next đồng bộ useSearchParams cho lệnh history của ứng dụng. Truyền lại state nội bộ
    // của router khiến Next coi đây là lệnh riêng của nó và bỏ qua cập nhật các hook.
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const getFilterValues = (key: K) => parseFilterValues(extraFilters[key]);

  return {
    /** Gửi thẳng vào hook query của module. */
    filters: {
      search: keyword,
      page: state.page,
      pageSize: state.pageSize,
      ordering: state.ordering,
    },
    keyword,
    extraFilters,
    setFilter: (key: K, value: string | undefined) => update({ page: 1 }, { [key]: value }),
    /** Giá trị của bộ lọc chọn nhiều (URL lưu dạng `a,b`). */
    getFilterValues,
    /** Ghi bộ lọc chọn nhiều; mảng rỗng là bỏ lọc. Về trang 1. */
    setFilterValues: (key: K, values: readonly string[]) =>
      update({ page: 1 }, { [key]: values.length ? values.join(",") : undefined }),
    /** Có bộ lọc riêng của module nào đang áp dụng không. */
    hasFilters: filterKeys.some((key) => Boolean(extraFilters[key])),
    clearFilters: () =>
      update(
        { search: "", page: 1 },
        Object.fromEntries(filterKeys.map((key) => [key, undefined])),
      ),
    search: {
      value: state.search,
      onValueChange: (value: string) => update({ search: value, page: 1 }),
    },
    ordering: state.ordering,
    onOrderingChange: (ordering: string | undefined) => update({ ordering, page: 1 }),
    onPageChange: (page: number) => update({ page }),
    onPageSizeChange: (pageSize: number) => update({ pageSize, page: 1 }),
  };
}
