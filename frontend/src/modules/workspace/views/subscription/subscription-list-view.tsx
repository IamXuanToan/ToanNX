"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { SubscriptionTable } from "../../components/subscription/subscription-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { SUBSCRIPTION_PERMISSIONS } from "../../permissions/subscription-permission";

/** @returns Trang danh sách Dịch vụ định kỳ. */
export function SubscriptionListView() {
  const t = useTranslations("workspace.subscriptions");
  const canRead = usePermission(SUBSCRIPTION_PERMISSIONS.read);
  const canCreate = usePermission(SUBSCRIPTION_PERMISSIONS.create);
  const canUpdate = usePermission(SUBSCRIPTION_PERMISSIONS.update);
  const canDelete = usePermission(SUBSCRIPTION_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.subscriptionCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <SubscriptionTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
