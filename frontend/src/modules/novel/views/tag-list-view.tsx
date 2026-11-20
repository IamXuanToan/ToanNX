/**
 * Trang danh sách thẻ truyện (`/admin/tags`).
 */

"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { TagTable } from "../components/tag-table";
import { NOVEL_ROUTES } from "../constants/routes";
import { TAG_PERMISSIONS } from "../permissions/tag-permission";

/**
 * Giao diện quản trị danh sách thẻ truyện.
 *
 * @returns Khối giao diện danh sách thẻ.
 */
export function TagListView() {
  const t = useTranslations("novel.tags");
  const canRead = usePermission(TAG_PERMISSIONS.read);
  const canCreate = usePermission(TAG_PERMISSIONS.create);
  const canUpdate = usePermission(TAG_PERMISSIONS.update);
  const canDelete = usePermission(TAG_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={NOVEL_ROUTES.adminTagCreate}>
                <Plus className="mr-1.5 size-4" />
                {t("createTitle")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TagTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
