"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AssetForm } from "../../components/asset/asset-form";
import { ASSET_PERMISSIONS } from "../../permissions/asset-permission";

/** @returns Trang tạo Thiết bị cá nhân mới. */
export function AssetCreateView() {
  const t = useTranslations("workspace.assets");
  const canCreate = usePermission(ASSET_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <AssetForm />
    </FormPage>
  );
}
