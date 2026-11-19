/**
 * Giao diện quản trị danh sách tiểu thuyết (`/admin/novels`).
 *
 * Kiểm tra quyền truy cập và hiển thị bảng tiểu thuyết kèm thao tác thêm mới và nhập truyện.
 */

"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { NovelImportDialog } from "../components/novel-import-dialog/novel-import-dialog";
import { NovelTable } from "../components/novel-table/novel-table";
import { NOVEL_ROUTES } from "../constants/routes";
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
        actions={
          canCreate ? (
            <div className="flex items-center gap-2">
              <NovelImportDialog />
              <Button asChild>
                <Link href={NOVEL_ROUTES.adminNovelCreate}>
                  <Plus className="mr-1.5 size-4" />
                  {t("createNovel")}
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      <NovelTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
