"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { VaultItemTable } from "../../components/vault-item/vault-item-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { VAULT_ITEM_PERMISSIONS } from "../../permissions/vault-item-permission";

/** @returns Trang danh sách Két sắt bí mật. */
export function VaultItemListView() {
  const t = useTranslations("workspace.vault");
  const canRead = usePermission(VAULT_ITEM_PERMISSIONS.read);
  const canCreate = usePermission(VAULT_ITEM_PERMISSIONS.create);
  const canUpdate = usePermission(VAULT_ITEM_PERMISSIONS.update);
  const canDelete = usePermission(VAULT_ITEM_PERMISSIONS.delete);
  const canReveal = usePermission(VAULT_ITEM_PERMISSIONS.reveal);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.vaultCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <VaultItemTable canUpdate={canUpdate} canDelete={canDelete} canReveal={canReveal} />
    </div>
  );
}
