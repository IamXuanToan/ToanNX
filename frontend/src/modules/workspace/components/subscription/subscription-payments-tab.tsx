"use client";

import { ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { useSubscriptionPayments } from "../../hooks/use-subscription-payments";

/**
 * Tab Lịch sử gia hạn bên trong trang Chi tiết Dịch vụ định kỳ.
 *
 * @param props - ID dịch vụ định kỳ.
 * @returns Danh sách các kỳ thanh toán đã ghi nhận.
 */
export function SubscriptionPaymentsTab({ subscriptionId }: { subscriptionId: string }) {
  const t = useTranslations("workspace.subscriptionPayments");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();

  const query = useSubscriptionPayments({ subscription: subscriptionId, pageSize: 50 });

  if (query.isPending) return <Skeleton className="h-32 w-full rounded-xl" />;
  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border p-6 text-center text-sm">
        {tCommon("noData")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((payment) => {
        const receiptUrl = toSafeHttpUrl(payment.receiptAttachment?.url);
        return (
          <div
            key={payment.id}
            className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {format.dateTime(new Date(payment.periodFrom), { dateStyle: "short" })} →{" "}
                {format.dateTime(new Date(payment.periodTo), { dateStyle: "short" })}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("fields.paidOn")}:{" "}
                {format.dateTime(new Date(payment.paidOn), { dateStyle: "short" })}
                {payment.paymentMethod ? ` · ${payment.paymentMethod}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {receiptUrl ? (
                <Link
                  href={receiptUrl as never}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                >
                  {t("fields.receipt")}
                  <ExternalLink className="size-3" aria-hidden />
                </Link>
              ) : null}
              <span className="font-semibold tabular-nums">
                {formatDisplayMoney(payment.amountVnd, { currency: DEFAULT_CURRENCY })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
