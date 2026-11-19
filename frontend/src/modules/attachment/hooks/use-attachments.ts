"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentFilters } from "../types/attachment.types";

/** @param filters - Bộ lọc. @param enabled - Quyền tải danh sách. @returns Trang file có giữ dữ liệu cũ khi chuyển trang. */
export function useAttachments(filters: AttachmentFilters, enabled = true) {
  return useListQuery(
    attachmentKeys.list(filters),
    (signal) => attachmentService.list(filters, signal),
    {
      enabled,
    },
  );
}
