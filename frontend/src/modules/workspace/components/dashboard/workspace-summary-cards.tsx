"use client";

import { Activity, BellRing, ShieldAlert, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { cn } from "cn";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useWorkspaceDashboard } from "../../hooks/use-workspace-dashboard";

/**
 * 4 thẻ KPI Không gian cá nhân trên Dashboard Portal:
 * Chi tiêu tháng + dự kiến dịch vụ, Nhắc việc hôm nay / quá hạn, Bảo hành sắp hết 30 ngày và Uptime Monitor.
 *
 * @returns Lưới 4 thẻ KPI Workspace.
 */
export function WorkspaceSummaryCards() {
  const t = useTranslations("portal.dashboard.workspace");
  const query = useWorkspaceDashboard();
  const data = query.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link href={WORKSPACE_ROUTES.subscriptions} className="block">
        <Card className="border-border bg-card hover:border-primary/40 h-full shadow-2xs transition-colors">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <Wallet className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("monthlySpending")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold tabular-nums sm:text-2xl">
                {query.isPending ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  formatDisplayMoney(data?.monthlySpendingVnd ?? "0", {
                    currency: DEFAULT_CURRENCY,
                  })
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                {t("monthlySpendingHint", {
                  amount: formatDisplayMoney(data?.upcomingSubscriptions14dVnd ?? "0", {
                    currency: DEFAULT_CURRENCY,
                  }),
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href={WORKSPACE_ROUTES.reminders} className="block">
        <Card className="border-border bg-card hover:border-primary/40 h-full shadow-2xs transition-colors">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-info-bg text-info flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <BellRing className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("remindersToday")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold tabular-nums sm:text-2xl">
                {query.isPending ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (data?.pendingRemindersToday ?? 0)
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                {t("remindersOverdue", { count: data?.overdueReminders ?? 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href={WORKSPACE_ROUTES.assets} className="block">
        <Card className="border-border bg-card hover:border-primary/40 h-full shadow-2xs transition-colors">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-warning-bg text-warning flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <ShieldAlert className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("expiringWarranty")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold tabular-nums sm:text-2xl">
                {query.isPending ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (data?.expiringWarranties30d ?? 0)
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                {t("expiringWarrantyHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href={WORKSPACE_ROUTES.monitors} className="block">
        <Card className="border-border bg-card hover:border-primary/40 h-full shadow-2xs transition-colors">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                (data?.monitorsDown ?? 0) > 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success-bg text-success",
              )}
            >
              <Activity className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                {t("monitorsHealth")}
              </p>
              <h3 className="text-foreground text-xl font-extrabold tabular-nums sm:text-2xl">
                {query.isPending ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  `${data?.monitorsHealthy ?? 0}/${data?.monitorsTotal ?? 0}`
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                {t("monitorsDownHint", { count: data?.monitorsDown ?? 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
