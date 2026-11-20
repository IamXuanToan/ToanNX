/**
 * Trang danh sách chương truyện (`/admin/chapters`).
 */

"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { ChapterTable } from "../components/chapter-table";
import { NOVEL_ROUTES } from "../constants/routes";
import { CHAPTER_PERMISSIONS } from "../permissions/chapter-permission";

/**
 * Giao diện quản trị danh sách chương truyện.
 *
 * @returns Khối giao diện danh sách chương.
 */
export function ChapterListView() {
  const t = useTranslations("novel.chapters");
  const canRead = usePermission(CHAPTER_PERMISSIONS.read);
  const canCreate = usePermission(CHAPTER_PERMISSIONS.create);
  const canUpdate = usePermission(CHAPTER_PERMISSIONS.update);
  const canDelete = usePermission(CHAPTER_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={NOVEL_ROUTES.adminChapterCreate}>
                <Plus className="mr-1.5 size-4" />
                {t("createTitle")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ChapterTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
