import { QrCode } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { QR_CODE_PERMISSIONS } from "./permissions/qr-code-permission";
import { QR_CODES_ROUTES } from "./constants/routes";

/** Mã QR nằm trong nhóm Tiện ích. */
export const qrCodesNavigation: AdminModuleNavigation = {
  module: "qr_codes",
  nameKey: "qrCodes.module.name",
  descriptionKey: "qrCodes.module.description",
  group: "content",
  icon: QrCode,
  items: [
    {
      labelKey: "qrCodes.nav.codes",
      href: QR_CODES_ROUTES.codes,
      icon: QrCode,
      permission: QR_CODE_PERMISSIONS.read,
    },
  ],
};
