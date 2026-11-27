"use client";

import {
  ArrowRight,
  BarChart3,
  Coins,
  ExternalLink,
  FileText,
  Heart,
  HeartHandshake,
  Landmark,
  Link2,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { FinanceKpiCards } from "@/modules/finance/components/dashboard/finance-kpi-cards";
import { FinancePlatformAreaChart } from "@/modules/finance/components/dashboard/finance-platform-area-chart";
import { FinanceShareDonut } from "@/modules/finance/components/dashboard/finance-share-donut";
import { FinanceTrendChart } from "@/modules/finance/components/dashboard/finance-trend-chart";
import { YearSelect } from "@/modules/finance/components/dashboard/year-select";
import { PortalCalendar } from "@/modules/workspace/components/calendar/portal-calendar";
import { WorkspaceSummaryCards } from "@/modules/workspace/components/dashboard/workspace-summary-cards";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { withEditMode } from "@/shares/lib/edit-mode";
import { formatVndText } from "@/shares/lib/number-format";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import { PORTAL_ROUTES } from "../../constants/routes";
import { usePortalDashboard } from "./hooks/use-portal-dashboard";
import { PortalDonationGiftChart } from "../donation/portal-donation-gift-chart";
import { PortalDonationTrendChart } from "./portal-donation-trend-chart";
import { PortalLinkClicksChart } from "./portal-link-clicks-chart";

/**
 * Component Tổng quan hợp nhất không gian cá nhân (Portal Dashboard):
 * Gom toàn bộ Workspace, Tài chính (KPI, biểu đồ theo nền tảng/màu sắc, tỷ trọng), Ủng hộ VietQR và Tiện ích
 * vào cùng một màn hình Dashboard duy nhất.
 *
 * @returns Giao diện Dashboard hợp nhất.
 */
export function PortalDashboard({
  canReadWorkspaceSummary = false,
  canReadCalendar = false,
  canCreateReminder = false,
  canUpdateReminder = false,
  canReadFinanceReports = false,
  canReadIncomes = false,
  canReadPages = false,
  canCreatePages = false,
  canUpdatePages = false,
  canReadShortLinks = false,
  canCreateShortLinks = false,
  canUpdateShortLinks = false,
  canReadDonations = false,
}: {
  canReadWorkspaceSummary?: boolean;
  canReadCalendar?: boolean;
  canCreateReminder?: boolean;
  canUpdateReminder?: boolean;
  canReadFinanceReports?: boolean;
  canReadIncomes?: boolean;
  canReadPages?: boolean;
  canCreatePages?: boolean;
  canUpdatePages?: boolean;
  canReadShortLinks?: boolean;
  canCreateShortLinks?: boolean;
  canUpdateShortLinks?: boolean;
  canReadDonations?: boolean;
} = {}) {
  const t = useTranslations("portal.dashboard");
  const tFinance = useTranslations("finance.dashboard");
  const tActions = useTranslations("common.actions");
  const tTable = useTranslations("common.table");
  const tPages = useTranslations("portal.pages");

  const {
    currentUser,
    finance,
    pages,
    links,
    totalClicks,
    linksQuery,
    donationStats,
    donationStatsQuery,
    handleCopy,
    monthLabel,
    openMonthReport,
  } = usePortalDashboard({
    canReadPages,
    canReadShortLinks,
    canReadDonations,
    canReadFinanceReports,
  });

  const totalPages = pages.length;
  const totalLinks = links.length;
  const showMoneySection =
    canReadFinanceReports || canReadDonations || canReadPages || canReadShortLinks;

  return (
    <div className="space-y-8" data-testid="portal-dashboard">
      {/* Welcome Banner */}
      <div className="border-border from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-r p-6 shadow-2xs sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>{t("studioBadge")}</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("welcome", {
                name: formatUserDisplayName(currentUser?.user, { includeUsername: false }),
              })}
            </h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Workspace KPIs & Personal Calendar */}
      {canReadWorkspaceSummary ? <WorkspaceSummaryCards /> : null}
      {canReadCalendar ? (
        <PortalCalendar
          canReadCalendar={canReadCalendar}
          canCreateReminder={canCreateReminder}
          canUpdateReminder={canUpdateReminder}
        />
      ) : null}

      {/* Unified Finance, Donations & Utilities Overview */}
      {showMoneySection ? (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                {t("unified.title")}
              </h2>
              <p className="text-muted-foreground text-xs">{t("unified.subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canReadFinanceReports ? (
                <YearSelect value={finance.year} years={finance.years} onChange={finance.setYear} />
              ) : null}
              {canReadIncomes ? (
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                  <Link href={PORTAL_ROUTES.financeIncomes}>
                    <Landmark className="size-3.5" />
                    <span>{t("unified.viewIncomes")}</span>
                  </Link>
                </Button>
              ) : null}
              {canReadDonations ? (
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                  <Link href={PORTAL_ROUTES.donations}>
                    <HeartHandshake className="size-3.5" />
                    <span>{t("unified.viewDonations")}</span>
                  </Link>
                </Button>
              ) : null}
              {canReadFinanceReports ? (
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                  <Link href={PORTAL_ROUTES.financeReports}>
                    <BarChart3 className="size-3.5" />
                    <span>{t("unified.viewReports")}</span>
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Finance KPIs */}
          {canReadFinanceReports ? (
            finance.monthly.isPending ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : finance.monthly.isError ? (
              <ErrorState onRetry={() => finance.monthly.refetch()} />
            ) : (
              <FinanceKpiCards kpis={finance.kpis} />
            )
          ) : null}

          {/* Utilities & Donate KPIs */}
          {canReadDonations || canReadPages || canReadShortLinks ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {canReadDonations ? (
                <Card className="border-border bg-card shadow-2xs">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                      <Coins className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {t("stats.totalDonations")}
                      </p>
                      <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                        {donationStatsQuery.isLoading ? (
                          <Skeleton className="h-7 w-24" />
                        ) : (
                          formatVndText(donationStats?.totalAmount ?? 0)
                        )}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {t("stats.totalDonationsHint")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {canReadPages ? (
                <Card className="border-border bg-card shadow-2xs">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                      <FileText className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {t("stats.totalPages")}
                      </p>
                      <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                        {totalPages}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {t("stats.totalPagesHint")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {canReadShortLinks ? (
                <Card className="border-border bg-card shadow-2xs">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                      <Link2 className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {t("stats.totalShortLinks")}
                      </p>
                      <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                        {totalLinks}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {t("stats.totalShortLinksHint")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {canReadShortLinks ? (
                <Card className="border-border bg-card shadow-2xs">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MousePointerClick className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {t("stats.totalClicks")}
                      </p>
                      <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                        {totalClicks}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {t("stats.totalClicksHint")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* Finance Charts */}
          {canReadFinanceReports && !finance.monthly.isPending && !finance.monthly.isError ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <FinanceTrendChart
                  metric="total"
                  color="var(--chart-1)"
                  points={finance.points}
                  onMonthClick={openMonthReport}
                />
                <FinancePlatformAreaChart
                  platforms={finance.platformSeries.platforms}
                  colors={finance.platformSeries.platformColors}
                  rows={finance.platformSeries.rows}
                  monthLabel={monthLabel}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <FinanceShareDonut
                  title={tFinance("charts.platformShare")}
                  items={finance.platformShare}
                />
                <FinanceShareDonut
                  title={tFinance("charts.currencyShare")}
                  items={finance.currencyShare}
                />
              </div>
            </div>
          ) : null}

          {/* Donation & Link Analytics */}
          {canReadDonations || canReadShortLinks ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {canReadDonations ? (
                <>
                  <PortalDonationTrendChart
                    data={donationStats?.dailyTrend}
                    isLoading={donationStatsQuery.isLoading}
                  />
                  <PortalDonationGiftChart
                    byGift={donationStats?.byGift}
                    isLoading={donationStatsQuery.isLoading}
                  />
                </>
              ) : null}
              {canReadShortLinks ? (
                <PortalLinkClicksChart links={links} isLoading={linksQuery.isLoading} />
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Quick Actions */}
      {canCreatePages || canCreateShortLinks ? (
        <div>
          <h2 className="text-foreground mb-4 text-base font-bold tracking-tight">
            {t("quickActions.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {canCreatePages ? (
              <>
                <Link
                  href={PORTAL_ROUTES.pageCreate}
                  className="group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                      <User className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground group-hover:text-primary text-sm font-bold">
                        {t("quickActions.createBio")}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {t("quickActions.createBioDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="text-primary mt-4 flex items-center gap-1 text-xs font-semibold">
                    <span>{t("start")}</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>

                <Link
                  href={PORTAL_ROUTES.pageCreate}
                  className="group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground group-hover:text-primary text-sm font-bold">
                        {t("quickActions.createAffiliate")}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {t("quickActions.createAffiliateDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="text-primary mt-4 flex items-center gap-1 text-xs font-semibold">
                    <span>{t("start")}</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>

                <Link
                  href={PORTAL_ROUTES.pageCreate}
                  className="group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Heart className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground group-hover:text-primary text-sm font-bold">
                        {t("quickActions.createDonation")}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {t("quickActions.createDonationDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="text-primary mt-4 flex items-center gap-1 text-xs font-semibold">
                    <span>{t("start")}</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </>
            ) : null}

            {canCreateShortLinks ? (
              <Link
                href={PORTAL_ROUTES.shortLinkCreate}
                className="group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Link2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground group-hover:text-primary text-sm font-bold">
                      {t("quickActions.createShortLink")}
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {t("quickActions.createShortLinkDesc")}
                    </p>
                  </div>
                </div>
                <div className="text-primary mt-4 flex items-center gap-1 text-xs font-semibold">
                  <span>{t("start")}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Recents: Pages & Short Links */}
      {canReadPages || canReadShortLinks ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {canReadPages ? (
            <Card className="border-border bg-card rounded-2xl shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-foreground text-sm font-bold">
                  {t("recentPages")}
                </CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-primary h-7 gap-1 text-xs"
                >
                  <Link href={PORTAL_ROUTES.pages}>
                    <span>{t("viewAll")}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-xs">
                    {t("emptyPages")}
                  </p>
                ) : (
                  <div className="divide-border divide-y">
                    {pages.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0 pr-3">
                          <p className="text-foreground truncate text-xs font-semibold">
                            {p.title}
                          </p>
                          <p className="text-muted-foreground truncate font-mono text-[11px]">
                            {p.publicUrl}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <AppTooltip content={tPages("copyLink")}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleCopy(p.publicUrl)}
                              className="size-7"
                            >
                              <Link2 className="size-3.5" />
                            </Button>
                          </AppTooltip>
                          <AppTooltip content={tPages("view")}>
                            <Button asChild variant="ghost" size="icon-xs" className="size-7">
                              <Link
                                href={(toSafeHttpUrl(p.publicUrl) ?? "#") as never}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="size-3.5" />
                              </Link>
                            </Button>
                          </AppTooltip>
                          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Link
                              href={
                                canUpdatePages
                                  ? withEditMode(PORTAL_ROUTES.pageDetail(p.id))
                                  : PORTAL_ROUTES.pageDetail(p.id)
                              }
                            >
                              {canUpdatePages ? tActions("edit") : tTable("view")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {canReadShortLinks ? (
            <Card className="border-border bg-card rounded-2xl shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-foreground text-sm font-bold">
                  {t("recentLinks")}
                </CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-primary h-7 gap-1 text-xs"
                >
                  <Link href={PORTAL_ROUTES.shortLinks}>
                    <span>{t("viewAll")}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-xs">
                    {t("emptyLinks")}
                  </p>
                ) : (
                  <div className="divide-border divide-y">
                    {links.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0 pr-3">
                          <p className="text-foreground truncate text-xs font-semibold">{l.name}</p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {l.destinationUrl}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="gap-1 px-2 py-0 font-mono text-[10px]"
                          >
                            <MousePointerClick className="size-3" />
                            <span>{l.clicksCount ?? 0}</span>
                          </Badge>
                          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Link
                              href={
                                canUpdateShortLinks
                                  ? withEditMode(PORTAL_ROUTES.shortLinkDetail(l.id))
                                  : PORTAL_ROUTES.shortLinkDetail(l.id)
                              }
                            >
                              {canUpdateShortLinks ? tActions("edit") : tTable("view")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
