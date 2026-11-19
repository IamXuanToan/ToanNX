/**
 * Hook mutation xóa hàng loạt tiểu thuyết.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation xóa nhiều tiểu thuyết cùng lúc theo danh sách ID.
 *
 * @returns Đối tượng mutation cho thao tác xóa hàng loạt tiểu thuyết.
 */
export function useBulkDeleteNovels() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => novelService.bulkDelete(ids),
    invalidate: [novelKeys.novel.all],
    success: "bulkDeleted",
  });
}
