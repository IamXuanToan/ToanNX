"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { AssetTable } from "../../components/asset/asset-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { ASSET_PERMISSIONS } from "../../permissions/asset-permission";

/** @returns Trang danh sách Thiết bị cá nhân. */
export function AssetListView() {
  const t = useTranslations("workspace.assets");
  const canRead = usePermission(ASSET_PERMISSIONS.read);
  const canCreate = usePermission(ASSET_PERMISSIONS.create);
  const canUpdate = usePermission(ASSET_PERMISSIONS.update);
  const canDelete = usePermission(ASSET_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.assetCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <AssetTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
