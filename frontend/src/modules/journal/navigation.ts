import { History } from "lucide-react";

import type { AdminModuleNavigation } from "@/shares/types/navigation.types";

import { JOURNAL_ENTRY_PERMISSIONS } from "./permissions/journal-entry-permission";
import { JOURNAL_ROUTES } from "./constants/routes";

/** Nhật ký nằm trong nhóm Hệ thống, chỉ hiện khi có quyền xem nhật ký. */
export const journalNavigation: AdminModuleNavigation = {
  module: "journal",
  nameKey: "journal.module.name",
  descriptionKey: "journal.module.description",
  group: "system",
  icon: History,
  items: [
    {
      labelKey: "journal.nav.entries",
      href: JOURNAL_ROUTES.entries,
      icon: History,
      permission: JOURNAL_ENTRY_PERMISSIONS.entryRead,
    },
  ],
};
