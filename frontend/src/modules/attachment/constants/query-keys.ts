import type { AttachmentFilters } from "../types/attachment.types";

/** Khóa cache của thư viện, dùng lại ở bộ chọn ảnh. */
export const attachmentKeys = {
  all: ["attachment"] as const,
  folders: (scope?: readonly string[]) => ["attachment", "folders", scope ?? []] as const,
  lists: () => [...attachmentKeys.all, "list"] as const,
  list: (filters: AttachmentFilters) => [...attachmentKeys.lists(), filters] as const,
};
