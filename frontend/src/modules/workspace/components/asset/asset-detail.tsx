"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { AssetClaimsTab } from "./asset-claims-tab";
import { AssetForm } from "./asset-form";
import { useAssetDetail } from "./hooks/use-asset-detail";

/**
 * Trang chi tiết Thiết bị: hỗ trợ 3 tab (`general`, `claims`, `history`) đồng bộ URL `?tab=`
 * và chế độ chỉ xem / sửa qua `EditModeProvider`.
 *
 * @param props - ID thiết bị, quyền sửa, quyền tạo phiếu BH, slot lịch sử.
 * @returns Chi tiết Thiết bị.
 */
export function AssetDetail({
  id,
  canUpdate,
  canCreateClaim,
  canUpdateClaim = false,
  canDeleteClaim = false,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canCreateClaim: boolean;
  canUpdateClaim?: boolean;
  canDeleteClaim?: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.assets");
  const { query } = useAssetDetail(id);

  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={WORKSPACE_ROUTES.assets}
      />
    );
  }

  return (
    <FormPage title={query.data.name || t("editTitle")} backHref={WORKSPACE_ROUTES.assets}>
      <RecordDetailTabs
        general={<AssetForm asset={query.data} disabled={!canUpdate} />}
        extraTabs={[
          {
            value: "claims",
            label: t("tabClaims", { count: query.data.totalClaimCount }),
            content: (
              <AssetClaimsTab
                asset={query.data}
                canCreateClaim={canCreateClaim}
                canUpdateClaim={canUpdateClaim}
                canDeleteClaim={canDeleteClaim}
              />
            ),
          },
        ]}
        history={history}
      />
    </FormPage>
  );
}
