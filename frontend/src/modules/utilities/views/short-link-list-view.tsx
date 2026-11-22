"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/system/components/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { ShortLinkTable } from "../components/short-link-table";
import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";
import { UTILITIES_ROUTES } from "../constants/routes";

/** Trang danh sách link rút gọn. */
export function ShortLinkListView() {
  const t = useTranslations("utilities.shortLinks");
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);
  const canDelete = usePermission(SHORT_LINK_PERMISSIONS.delete);
  const canManageAll = usePermission(SHORT_LINK_PERMISSIONS.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={SHORT_LINK_PERMISSIONS.create}>
            <Button asChild>
              <Link href={UTILITIES_ROUTES.shortLinkCreate}>
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
