/**
 * Trang danh sách tác giả (`/admin/authors`).
 */

"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { AuthorTable } from "../../components/author/author-table";
import { NOVEL_ROUTES } from "../../constants/routes";
import { AUTHOR_PERMISSIONS } from "../../permissions/author-permission";

/**
 * Giao diện quản trị danh sách tác giả.
 *
 * @returns Khối giao diện danh sách tác giả.
 */
export function AuthorListView() {
  const t = useTranslations("novel.authors");
  const canRead = usePermission(AUTHOR_PERMISSIONS.read);
  const canCreate = usePermission(AUTHOR_PERMISSIONS.create);
  const canUpdate = usePermission(AUTHOR_PERMISSIONS.update);
  const canDelete = usePermission(AUTHOR_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={NOVEL_ROUTES.adminAuthorCreate}>
                <Plus className="mr-1.5 size-4" />
                {t("createTitle")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <AuthorTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
