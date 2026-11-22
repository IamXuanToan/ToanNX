/**
 * Hook mutation xóa một tiểu thuyết.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook mutation xóa một tiểu thuyết theo ID.
 *
 * Tự động làm mới danh sách sau khi xóa và hiện thông báo toast.
 *
 * @returns Đối tượng mutation cho thao tác xóa tiểu thuyết.
 */
export function useDeleteNovel() {
  return useResourceMutation({
    mutationFn: (id: string) => novelService.delete(id),
    invalidate: [novelKeys.novel.all],
    success: "deleted",
  });
}
