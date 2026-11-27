"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { WarrantyClaimTable } from "../../components/asset-warranty-claim/warranty-claim-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "../../permissions/asset-warranty-claim-permission";

/** @returns Trang danh sách Phiếu bảo hành / sửa chữa thiết bị. */
export function WarrantyClaimListView() {
  const t = useTranslations("workspace.warrantyClaims");
  const canRead = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.read);
  const canCreate = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.create);
  const canUpdate = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.update);
  const canDelete = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.warrantyClaimCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <WarrantyClaimTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
