"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useWarrantyClaims } from "../../hooks/use-warranty-claims";
import type { Asset } from "../../types/asset.types";

/**
 * Tab Bảo hành & Sửa chữa trong trang Chi tiết Thiết bị:
 * tóm tắt thống kê bảo hành/sửa chữa, danh sách phiếu và nút tạo nhanh truyền `?assetId=`.
 *
 * @param props - Thiết bị hiện tại và quyền tạo phiếu bảo hành.
 * @returns Danh sách phiếu bảo hành của thiết bị.
 */
export function AssetClaimsTab({
  asset,
  canCreateClaim,
}: {
  asset: Asset;
  canCreateClaim: boolean;
}) {
  const t = useTranslations("workspace.assets");
  const tClaim = useTranslations("workspace.warrantyClaims");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();

  const claimsQuery = useWarrantyClaims({ asset: asset.id, pageSize: 50 });

  return (
    <div className="space-y-4">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="text-primary size-4 shrink-0" aria-hidden />
          <span>
            {t("claimsSummary", {
              claims: asset.warrantyClaimCount,
              repairs: asset.repairCount,
              open: asset.openClaimCount,
              cost: formatDisplayMoney(asset.totalServiceCostVnd, { currency: DEFAULT_CURRENCY }),
            })}
          </span>
        </div>
        {canCreateClaim ? (
          <Button asChild size="sm">
            <Link
              href={
                {
                  pathname: WORKSPACE_ROUTES.warrantyClaimCreate,
                  query: { assetId: asset.id },
                } as never
              }
            >
              <Plus />
              {t("newClaim")}
            </Link>
          </Button>
        ) : null}
      </div>

      {claimsQuery.isPending ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (claimsQuery.data?.items.length ?? 0) === 0 ? (
        <p className="text-muted-foreground rounded-xl border p-6 text-center text-sm">
          {tCommon("noData")}
        </p>
      ) : (
        <div className="space-y-2">
          {claimsQuery.data?.items.map((claim) => (
            <div
              key={claim.id}
              className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={WORKSPACE_ROUTES.warrantyClaimDetail(claim.id)}
                  className="hover:text-primary font-medium underline-offset-4 hover:underline"
                >
                  {claim.claimCode || claim.issueDescription}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {tClaim(`types.${claim.claimType}`)} ·{" "}
                  {format.dateTime(new Date(claim.submittedDate), { dateStyle: "short" })} ·{" "}
                  {claim.serviceCenter || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">
                  {formatDisplayMoney(claim.costVnd, { currency: DEFAULT_CURRENCY })}
                </span>
                <StatusBadge
                  tone={
                    claim.status === "COMPLETED"
                      ? "success"
                      : claim.status === "REJECTED"
                        ? "danger"
                        : "info"
                  }
                >
                  {tClaim(`statuses.${claim.status}`)}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
