"use client";

import type { QueryKey } from "@tanstack/react-query";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

/**
 * Phần service cần cho thao tác hàng loạt (có sẵn trong `createCrudService`). Tài nguyên chỉ xoá hàng loạt
 * (nhật ký) thì không có `bulkUpdate`.
 */
type BulkCapableService = {
  bulkDelete: (ids: string[]) => Promise<number>;
  bulkUpdate?: (ids: string[], patch: Record<string, unknown>) => Promise<number>;
};

/** Lỗi lập trình: gọi cập nhật hàng loạt trên tài nguyên không có `bulk-update`. */
const BULK_UPDATE_UNSUPPORTED = "Tài nguyên này không có bulk-update";

/**
 * Xoá / cập nhật hàng loạt chuẩn cho mọi bảng: gọi `POST …/bulk-delete` và `POST …/bulk-update` của tài nguyên
 * (BE bật bằng `bulk_delete_enabled` / `bulk_update_serializer_class`), toast theo số bản ghi, làm mới khóa đã
 * khai. Hook bảng chỉ cần gọi hook này thay vì viết `useBulkDeleteXxx` / `useBulkSetXxxActive` riêng.
 *
 * ```ts
 * const bulk = useBulkActions<Currency>({ service: currencyService, invalidate: [currencyKeys.all] });
 * <DataTable onBulkDelete={canDelete ? bulk.bulkDelete : undefined}
 *   bulkStatus={canUpdate ? createBooleanBulkStatus(labels, (rows, on) => bulk.bulkUpdate(rows, { isActive: on })) : undefined} />
 * ```
 *
 * @param options - Service của tài nguyên và khóa cache cần làm mới.
 * @returns `bulkDelete(rows)` và `bulkUpdate(rows, patch)` (patch camelCase, `apiClient` tự đổi snake_case).
 */
export function useBulkActions<T extends { id: string }>({
  service,
  invalidate,
}: {
  service: BulkCapableService;
  invalidate: QueryKey | readonly QueryKey[];
}) {
  const remove = useResourceMutation<string[], number>({
    mutationFn: (ids) => service.bulkDelete(ids),
    invalidate,
    success: "bulkDeleted",
  });
  const update = useResourceMutation<{ ids: string[]; patch: Record<string, unknown> }, number>({
    mutationFn: ({ ids, patch }) =>
      service.bulkUpdate
        ? service.bulkUpdate(ids, patch)
        : Promise.reject(new Error(BULK_UPDATE_UNSUPPORTED)),
    invalidate,
    success: "bulkUpdated",
  });
  return {
    bulkDelete: (rows: T[]) => remove.mutateAsync(rows.map((row) => row.id)),
    bulkUpdate: (rows: T[], patch: Record<string, unknown>) =>
      update.mutateAsync({ ids: rows.map((row) => row.id), patch }),
  };
}
