"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import { usePlatform } from "../../hooks/use-platform";
import { PlatformForm } from "./platform-form";
import { PlatformTaxRatesSection } from "./platform-tax-rates-section";

/**
 * Chi tiết nền tảng: form + lịch sử khấu trừ + lịch sử thay đổi (slot).
 *
 * @param props - Id, quyền sửa, slot lịch sử.
 * @returns Trang chi tiết.
 */
export function PlatformProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const routes = useFinanceRoutes();
  const query = usePlatform(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={routes.platforms}
      />
    );
  return (
    <FormPage title={query.data.name}>
      <div className="space-y-6">
        <PlatformForm platform={query.data} disabled={!canUpdate} />
        <PlatformTaxRatesSection platformId={id} canUpdate={canUpdate} />
        {history}
      </div>
    </FormPage>
  );
}
