"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { LanguageTable } from "../../components/language/language-table";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { LANGUAGE_PERMISSIONS } from "../../permissions/language-permission";

/**
 * Màn hình danh sách Ngôn ngữ hệ thống.
 *
 * @returns Danh sách ngôn ngữ hoặc `ForbiddenView`.
 */
export function LanguageListView() {
  const t = useTranslations("system.languages");
  const canRead = usePermission(LANGUAGE_PERMISSIONS.read);
  const canCreate = usePermission(LANGUAGE_PERMISSIONS.create);
  const canUpdate = usePermission(LANGUAGE_PERMISSIONS.update);
  const canDelete = usePermission(LANGUAGE_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={SYSTEM_ROUTES.languageCreate}>
                <Plus className="mr-2 size-4" />
                {t("actions.create")}
              </Link>
            </Button>
          ) : null
        }
      />

      <LanguageTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
