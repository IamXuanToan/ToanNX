"use client";

import { Info, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { SepayConnection } from "../../components/sepay-connection/sepay-connection";
import { SepayImport } from "../../components/sepay-connection/sepay-import";
import { INCOME_PERMISSIONS } from "../../permissions/income-permission";
import { SEPAY_PERMISSIONS } from "../../permissions/sepay-permission";

/** Trang Kết nối SePay của chính mình + lấy giao dịch thủ công. */
export function SepayView() {
  const t = useTranslations("finance.sepay");
  const canManage = usePermission(SEPAY_PERMISSIONS.manage);
  const canImport = usePermission(INCOME_PERMISSIONS.create);

  if (!canManage) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />

      {/* Thẻ ghi chú hướng dẫn mục đích sử dụng kết nối SePay cá nhân */}
      <div className="border-primary/20 bg-primary/5 space-y-2.5 rounded-2xl border p-4 text-sm sm:p-5">
        <div className="text-primary flex items-center gap-2 font-semibold">
          <Info className="size-4.5 shrink-0" />
          <span>Mục đích kết nối SePay cá nhân</span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Kết nối SePay tại đây dùng để{" "}
          <strong>tự động nhận biến động số dư tài khoản ngân hàng của riêng bạn</strong> và tự động
          nhận diện, phân loại các khoản thu nhập (thanh toán hợp đồng, tiền lương, freelance, hoa
          hồng tiếp thị liên kết...) vào sổ theo dõi tài chính cá nhân này.
        </p>
        <div className="border-primary/10 text-muted-foreground flex flex-col gap-3 border-t pt-1 text-[11px] sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Độc lập & Bảo mật riêng tư</span>
          </div>
          <span>
            • Token và webhook này chỉ dùng cho tài khoản của bạn, không chia sẻ với người dùng
            khác.
          </span>
        </div>
      </div>

      <SepayConnection />
      {canImport ? <SepayImport /> : null}
    </div>
  );
}
