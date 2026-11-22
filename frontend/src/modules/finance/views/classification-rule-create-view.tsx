"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ClassificationRuleForm } from "../components/classification-rule-form";
import { RULE_PERMISSIONS } from "../permissions/rule-permission";

/** Trang tạo (finance.rules). */
export function ClassificationRuleCreateView() {
  const t = useTranslations("finance.rules");
  if (!usePermission(RULE_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <ClassificationRuleForm />
    </FormPage>
  );
}
