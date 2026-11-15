"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PagePathTable } from "../components/page-path-table/page-path-table";
import { CUSTOM_PAGES_PERMISSIONS as P } from "../constants/custom-pages-permissions";
import { CUSTOM_PAGES_ROUTES } from "../constants/routes";

/** Trang danh sách đường dẫn giữa. */
export function PagePathListView() {
  const t = useTranslations("customPages.paths");
  const canRead = usePermission(P.pathRead);
  const canUpdate = usePermission(P.pathUpdate);
  const canDelete = usePermission(P.pathDelete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={P.pathCreate}>
            <Button asChild>
              <Link href={CUSTOM_PAGES_ROUTES.pathCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <PagePathTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
