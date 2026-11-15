import { Images } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { ATTACHMENT_PERMISSIONS } from "./constants/attachment-permissions";
import { ATTACHMENT_ROUTES } from "./constants/routes";

/** Thư viện nằm trong nhóm Hệ thống, chỉ hiện khi có quyền xem file. */
export const attachmentNavigation: AdminModuleNavigation = {
  module: "attachment",
  nameKey: "common.adminModules.attachment.name",
  descriptionKey: "common.adminModules.attachment.description",
  group: "system",
  icon: Images,
  items: [
    {
      labelKey: "common.nav.attachments",
      href: ATTACHMENT_ROUTES.library,
      icon: Images,
      permission: ATTACHMENT_PERMISSIONS.read,
    },
  ],
};
