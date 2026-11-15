"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { JournalTable } from "../components/journal-table/journal-table";
import { JOURNAL_PERMISSIONS } from "../constants/journal-permissions";

/**
 * Trang Nhật ký: lịch sử thay đổi của mọi bản ghi, lọc theo module.model.
 *
 * @returns Giao diện nhật ký hoặc màn không có quyền.
 */
export function JournalListView() {
  const t = useTranslations("journal");
  const canRead = usePermission(JOURNAL_PERMISSIONS.entryRead);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <JournalTable />
    </div>
  );
}
