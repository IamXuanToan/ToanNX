"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { VaultItemForm } from "../../components/vault-item/vault-item-form";
import { VAULT_ITEM_PERMISSIONS } from "../../permissions/vault-item-permission";

/** @returns Trang tạo mục Két sắt bí mật mới. */
export function VaultItemCreateView() {
  const t = useTranslations("workspace.vault");
  const canCreate = usePermission(VAULT_ITEM_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <VaultItemForm />
    </FormPage>
  );
}
