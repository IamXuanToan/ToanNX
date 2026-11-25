"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ClassificationRuleCreateButton } from "../../components/classification-rule/classification-rule-create-button";
import { ClassificationRuleTable } from "../../components/classification-rule/classification-rule-table";
import { RULE_PERMISSIONS } from "../../permissions/rule-permission";

/** Trang danh sách (finance.rules). */
export function ClassificationRuleListView() {
  const t = useTranslations("finance.rules");
  const canRead = usePermission(RULE_PERMISSIONS.read);
  const canUpdate = usePermission(RULE_PERMISSIONS.update);
  const canDelete = usePermission(RULE_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={RULE_PERMISSIONS.create}>
            <ClassificationRuleCreateButton />
          </PermissionGate>
        }
      />
      <ClassificationRuleTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
