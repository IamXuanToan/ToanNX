"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { SubscriptionPaymentTable } from "../../components/subscription-payment/subscription-payment-table";
import { SUBSCRIPTION_PAYMENT_PERMISSIONS } from "../../permissions/subscription-payment-permission";

/** @returns Trang danh sách Lịch sử thanh toán gia hạn dịch vụ. */
export function SubscriptionPaymentListView() {
  const t = useTranslations("workspace.subscriptionPayments");
  const canRead = usePermission(SUBSCRIPTION_PAYMENT_PERMISSIONS.read);
  const canDelete = usePermission(SUBSCRIPTION_PAYMENT_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <SubscriptionPaymentTable canDelete={canDelete} />
    </div>
  );
}
