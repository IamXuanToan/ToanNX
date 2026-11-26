"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Asset } from "../../types/asset.types";
import { WarrantyClaimTable } from "../asset-warranty-claim/warranty-claim-table";

/**
 * Tab Lịch sử Bảo hành & Sửa chữa ngay trong trang Chi tiết Thiết bị:
 * thống kê nhanh chi phí/lượt mở, nút Tạo phiếu gắn sẵn `?assetId=` và tái sử dụng trọn vẹn
 * `WarrantyClaimTable` (tìm kiếm, lọc, xem/sửa/xóa và xóa hàng loạt) khóa theo thiết bị này.
 *
 * @param props - Thiết bị hiện tại và quyền thao tác phiếu bảo hành.
 * @returns Danh sách phiếu bảo hành theo thiết bị.
 */
export function AssetClaimsTab({
  asset,
  canCreateClaim,
  canUpdateClaim = false,
  canDeleteClaim = false,
}: {
  asset: Asset;
  canCreateClaim: boolean;
  canUpdateClaim?: boolean;
  canDeleteClaim?: boolean;
}) {
  const t = useTranslations("workspace.assets");

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

      <WarrantyClaimTable
        assetId={asset.id}
        canUpdate={canUpdateClaim}
        canDelete={canDeleteClaim}
      />
    </div>
  );
}
