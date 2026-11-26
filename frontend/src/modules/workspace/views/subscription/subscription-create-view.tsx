"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { SubscriptionForm } from "../../components/subscription/subscription-form";
import { SUBSCRIPTION_PERMISSIONS } from "../../permissions/subscription-permission";

/** @returns Trang tạo Dịch vụ định kỳ mới. */
export function SubscriptionCreateView() {
  const t = useTranslations("workspace.subscriptions");
  const canCreate = usePermission(SUBSCRIPTION_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage title={t("createTitle")}>
      <SubscriptionForm />
    </FormPage>
  );
}
