/**
 * Giao diện quản trị danh sách tiểu thuyết (`/admin/novels`).
 *
 * Kiểm tra quyền truy cập và hiển thị bảng tiểu thuyết kèm thao tác nhập truyện.
 */

"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { NovelImportDialog } from "../components/novel-import-dialog/novel-import-dialog";
import { NovelTable } from "../components/novel-table/novel-table";
import { NOVEL_PERMISSIONS } from "../permissions/novel-permission";

// ============================================================================
// VIEW
// ============================================================================

/**
 * Giao diện quản trị danh sách tiểu thuyết (`/admin/novels`).
 *
 * @returns Khối giao diện trang quản trị danh sách tiểu thuyết.
 */
export function AdminNovelListView() {
  const t = useTranslations("novel.admin");
  const canRead = usePermission(NOVEL_PERMISSIONS.read);
  const canCreate = usePermission(NOVEL_PERMISSIONS.create);
  const canUpdate = usePermission(NOVEL_PERMISSIONS.update);
  const canDelete = usePermission(NOVEL_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canCreate ? <NovelImportDialog /> : undefined}
      />

      <NovelTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
