"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PlatformForm } from "../../components/platform/platform-form";
import { PLATFORM_PERMISSIONS } from "../../permissions/platform-permission";
import { RULE_PERMISSIONS } from "../../permissions/rule-permission";

/** Trang tạo (finance.platforms). */
export function PlatformCreateView() {
  const t = useTranslations("finance.platforms");
  const canCreatePlatform = usePermission(PLATFORM_PERMISSIONS.create);
  const canReadRules = usePermission(RULE_PERMISSIONS.read);
  const canCreateRule = usePermission(RULE_PERMISSIONS.create);
  const canUpdateRule = usePermission(RULE_PERMISSIONS.update);
  const canDeleteRule = usePermission(RULE_PERMISSIONS.delete);
  if (!canCreatePlatform) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <PlatformForm
        canReadRules={canReadRules}
        canCreateRule={canCreateRule}
        canUpdateRule={canUpdateRule}
        canDeleteRule={canDeleteRule}
      />
    </FormPage>
  );
}
