import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { UTILITIES_SCOPE } from "../constants/query-keys";

/**
 * Danh mục quyền hạn đối với tài nguyên Góp ý / Báo lỗi ẩn danh (`PageFeedback`).
 *
 * Khớp backend `PageFeedbackPermission`.
 */
export const PAGE_FEEDBACK_PERMISSIONS = createResourcePermissions(
  UTILITIES_SCOPE,
  "page_feedback",
  {
    read: PERMISSION_ACTION.read,
    update: PERMISSION_ACTION.update,
    delete: PERMISSION_ACTION.delete,
    thank: "thank",
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
