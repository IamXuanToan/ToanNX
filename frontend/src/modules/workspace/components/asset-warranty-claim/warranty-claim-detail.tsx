"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useWarrantyClaimDetail } from "./hooks/use-warranty-claim-detail";
import { WarrantyClaimForm } from "./warranty-claim-form";

/**
 * Trang chi tiết Phiếu bảo hành / sửa chữa (Tab Thông tin chung + Lịch sử thay đổi),
 * gắn nút quay về thẳng tab Bảo hành của thiết bị chứa phiếu.
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
  const tCommon = useTranslations("workspace.common");
  const { query, activeTab, setActiveTab } = useWarrantyClaimDetail(id);

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
    <FormPage
      title={query.data.claimCode || query.data.assetName || t("editTitle")}
      actions={
        <Button asChild variant="outline">
          <Link
            href={
              {
                ...WORKSPACE_ROUTES.assetDetail(query.data.assetId),
                query: { tab: "claims" },
              } as never
            }
          >
            <ArrowLeft />
            {t("backToAsset")}
          </Link>
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="general">{tCommon("tabGeneral")}</TabsTrigger>
          {history ? <TabsTrigger value="history">{tCommon("tabHistory")}</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <WarrantyClaimForm claim={query.data} disabled={!canUpdate} />
        </TabsContent>
        {history ? (
          <TabsContent value="history" className="mt-4">
            {history}
          </TabsContent>
        ) : null}
      </Tabs>
    </FormPage>
  );
}
