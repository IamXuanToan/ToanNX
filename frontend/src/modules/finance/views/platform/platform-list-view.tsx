"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PlatformCreateButton } from "../../components/platform/platform-create-button";
import { PlatformTable } from "../../components/platform/platform-table";
import { PLATFORM_PERMISSIONS } from "../../permissions/platform-permission";
import { RULE_PERMISSIONS } from "../../permissions/rule-permission";

/** Trang danh sách (finance.platforms). */
export function PlatformListView() {
  const t = useTranslations("finance.platforms");
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  const canCreate = usePermission(PLATFORM_PERMISSIONS.create);
  const canUpdate = usePermission(PLATFORM_PERMISSIONS.update);
  const canDelete = usePermission(PLATFORM_PERMISSIONS.delete);
  const canReadRules = usePermission(RULE_PERMISSIONS.read);
  const canCreateRule = usePermission(RULE_PERMISSIONS.create);
  const canUpdateRule = usePermission(RULE_PERMISSIONS.update);
  const canDeleteRule = usePermission(RULE_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={PLATFORM_PERMISSIONS.create}>
            <PlatformCreateButton />
          </PermissionGate>
        }
      />
      <PlatformTable
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canReadRules={canReadRules}
        canCreateRule={canCreateRule}
        canUpdateRule={canUpdateRule}
        canDeleteRule={canDeleteRule}
      />
    </div>
  );
}
