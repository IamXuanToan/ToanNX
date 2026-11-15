"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { ShortLinkTable } from "../components/short-link-table/short-link-table";
import { SHORT_LINKS_ROUTES } from "../constants/routes";
import { SHORT_LINKS_PERMISSIONS } from "../constants/short-links-permissions";

/** Trang danh sách link rút gọn. */
export function ShortLinkListView() {
  const t = useTranslations("shortLinks");
  const canRead = usePermission(SHORT_LINKS_PERMISSIONS.read);
  const canUpdate = usePermission(SHORT_LINKS_PERMISSIONS.update);
  const canDelete = usePermission(SHORT_LINKS_PERMISSIONS.delete);
  const canManageAll = usePermission(SHORT_LINKS_PERMISSIONS.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={SHORT_LINKS_PERMISSIONS.create}>
            <Button asChild>
              <Link href={SHORT_LINKS_ROUTES.linkCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <ShortLinkTable canUpdate={canUpdate} canDelete={canDelete} showOwner={canManageAll} />
    </div>
  );
}
