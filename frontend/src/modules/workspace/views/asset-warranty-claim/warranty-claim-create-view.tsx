"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { WarrantyClaimForm } from "../../components/asset-warranty-claim/warranty-claim-form";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "../../permissions/asset-warranty-claim-permission";

/** @returns Trang tạo Phiếu bảo hành / sửa chữa mới. */
export function WarrantyClaimCreateView() {
  const t = useTranslations("workspace.warrantyClaims");
  const canCreate = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <WarrantyClaimForm />
    </FormPage>
  );
}
