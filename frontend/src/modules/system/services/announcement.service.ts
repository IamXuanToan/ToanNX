import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { ListParams } from "@/shares/types/api.types";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { SystemAnnouncement, SystemAnnouncementInput } from "../types/notification.types";

/** Service thông báo hệ thống (BE `system_announcement_service.py`): tạo = gửi, xóa = thu hồi. */
export const announcementService = createCrudService<
  SystemAnnouncement,
  ListParams,
  SystemAnnouncementInput
>(SYSTEM_API_ENDPOINTS.announcements);
