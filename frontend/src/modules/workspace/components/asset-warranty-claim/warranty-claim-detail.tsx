"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useWarrantyClaimDetail } from "./hooks/use-warranty-claim-detail";
import { WarrantyClaimForm } from "./warranty-claim-form";

/**
 * Trang chi tiết Phiếu bảo hành / sửa chữa (Tab Thông tin chung + Lịch sử thay đổi).
 * Nút Quay lại trên `FormPage` tự trỏ về đúng tab Bảo hành của thiết bị chứa phiếu ở mọi tab.
 *
 * @param props - ID phiếu, quyền sửa, slot lịch sử.
 * @returns Chi tiết Phiếu bảo hành.
 */
export function WarrantyClaimDetail({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.warrantyClaims");
  const { query } = useWarrantyClaimDetail(id);

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

  const backHref = query.data.assetId
    ? {
        ...WORKSPACE_ROUTES.assetDetail(query.data.assetId),
        query: { tab: "claims" },
      }
    : WORKSPACE_ROUTES.assets;

  return (
    <FormPage
      title={query.data.claimCode || query.data.assetName || t("editTitle")}
      backHref={backHref as never}
    >
      <RecordDetailTabs
        general={<WarrantyClaimForm claim={query.data} disabled={!canUpdate} />}
        history={history}
      />
    </FormPage>
  );
}
