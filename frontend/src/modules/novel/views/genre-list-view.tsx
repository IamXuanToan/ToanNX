/**
 * Trang danh sách thể loại (`/admin/genres`).
 */

"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { GenreTable } from "../components/genre-table";
import { NOVEL_ROUTES } from "../constants/routes";
import { GENRE_PERMISSIONS } from "../permissions/genre-permission";

/**
 * Giao diện quản trị danh sách thể loại.
 *
 * @returns Khối giao diện danh sách thể loại.
 */
export function GenreListView() {
  const t = useTranslations("novel.genres");
  const canRead = usePermission(GENRE_PERMISSIONS.read);
  const canCreate = usePermission(GENRE_PERMISSIONS.create);
  const canUpdate = usePermission(GENRE_PERMISSIONS.update);
  const canDelete = usePermission(GENRE_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={NOVEL_ROUTES.adminGenreCreate}>
                <Plus className="mr-1.5 size-4" />
                {t("createTitle")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <GenreTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
