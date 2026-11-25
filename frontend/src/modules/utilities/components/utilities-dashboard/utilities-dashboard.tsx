"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Coffee,
  Coins,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Link2,
  MousePointerClick,
  QrCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { useTabState } from "@/shares/hooks/use-tab-state";

import { donationKeys, pageKeys, qrCodeKeys, shortLinkKeys } from "../../constants/query-keys";
import { UTILITIES_ROUTES } from "../../constants/routes";
import { DONATION_PERMISSIONS } from "../../permissions/donation-permission";
import { PAGE_PERMISSIONS } from "../../permissions/page-permission";
import { QR_CODE_PERMISSIONS } from "../../permissions/qr-code-permission";
import { SHORT_LINK_PERMISSIONS } from "../../permissions/short-link-permission";
import { donationService } from "../../services/donation.service";
import { pageService } from "../../services/page.service";
import { qrCodeService } from "../../services/qr-code.service";
import { shortLinkService } from "../../services/short-link.service";

/**
 * Dashboard trung tâm của module Tiện ích (Admin Quản trị toàn hệ thống):
 * Thống kê tổng hợp toàn bộ 4 trụ cột nghiệp vụ: Quyên góp (Donations), Trang tùy chỉnh (Pages),
 * Link rút gọn (ShortLinks) và Mã QR (QRCodes).
 */
export function UtilitiesDashboard() {
  const t = useTranslations("utilities.dashboard");
  const format = useFormatter();
  const canReadDonations = usePermission(DONATION_PERMISSIONS.read);
  const canReadShortLinks = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canReadPages = usePermission(PAGE_PERMISSIONS.read);
  const canReadQrCodes = usePermission(QR_CODE_PERMISSIONS.read);

  const [activeTab, setActiveTab] = useTabState({
    validTabs: ["overview", "donations", "links", "pages"] as const,
    defaultTab: "overview",
  });

  const effectiveTab =
    (activeTab === "donations" && !canReadDonations) ||
    (activeTab === "links" && !canReadShortLinks) ||
    (activeTab === "pages" && !canReadPages)
      ? "overview"
      : activeTab;

  // Truy vấn thống kê quyên góp toàn sàn
  const donationStatsQuery = useQuery({
    queryKey: donationKeys.stats(),
    queryFn: ({ signal }) => donationService.stats(undefined, signal),
    enabled: canReadDonations,
  });

  // Truy vấn top links rút gọn
  const shortLinksQuery = useQuery({
    queryKey: [...shortLinkKeys.lists(), "top-clicks"],
    queryFn: ({ signal }) =>
      shortLinkService.list({ pageSize: 5, ordering: "-clicks_count" }, signal),
    enabled: canReadShortLinks,
  });

  // Truy vấn trang mới tạo
  const pagesQuery = useQuery({
    queryKey: [...pageKeys.lists(), "recent"],
    queryFn: ({ signal }) => pageService.list({ pageSize: 5, ordering: "-created_at" }, signal),
    enabled: canReadPages,
  });

  // Truy vấn mã QR
  const qrCodesQuery = useQuery({
    queryKey: [...qrCodeKeys.lists(), "recent"],
    queryFn: ({ signal }) => qrCodeService.list({ pageSize: 5, ordering: "-created_at" }, signal),
    enabled: canReadQrCodes,
  });

  // Truy vấn bình luận quyên góp bị kiểm duyệt vi phạm từ ngữ
  const censoredDonationsQuery = useQuery({
    queryKey: [...donationKeys.lists(), "censored"],
    queryFn: ({ signal }) => donationService.list({ isCensored: true, pageSize: 5 }, signal),
    enabled: canReadDonations,
  });

  const donationStats = donationStatsQuery.data;
  const topLinks = shortLinksQuery.data?.items ?? [];
  const recentPages = pagesQuery.data?.items ?? [];
  const recentQrCodes = qrCodesQuery.data?.items ?? [];
  const censoredDonations = censoredDonationsQuery.data?.items ?? [];

  const totalClicks = topLinks.reduce((sum, item) => sum + (item.clicksCount ?? 0), 0);
  const totalPagesCount = pagesQuery.data?.pagination?.total ?? 0;
  const totalQrCount = qrCodesQuery.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-border from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-r p-6 shadow-2xs sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* KPI Cards Hàng Ngang */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Tổng tiền quyên góp */}
        {canReadDonations ? (
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Coins className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {t("kpiDonationsTitle")}
                </p>
                <h3 className="text-foreground text-lg font-extrabold tracking-tight whitespace-nowrap sm:text-xl">
                  {donationStatsQuery.isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    `${format.number(donationStats?.totalAmount ?? 0)} ${CURRENCY_SYMBOLS.VND}`
                  )}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {t("kpiDonationsHint", { count: donationStats?.totalCount ?? 0 })}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 2. Tổng click link */}
        {canReadShortLinks ? (
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <MousePointerClick className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {t("kpiClicksTitle")}
                </p>
                <h3 className="text-foreground text-lg font-extrabold tracking-tight whitespace-nowrap sm:text-xl">
                  {shortLinksQuery.isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    format.number(totalClicks)
                  )}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {t("kpiClicksHint", { count: shortLinksQuery.data?.pagination?.total ?? 0 })}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 3. Tổng số trang tùy chỉnh */}
        {canReadPages ? (
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {t("kpiPagesTitle")}
                </p>
                <h3 className="text-foreground text-lg font-extrabold tracking-tight whitespace-nowrap sm:text-xl">
                  {pagesQuery.isLoading ? <Skeleton className="h-7 w-16" /> : totalPagesCount}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-[11px]">{t("kpiPagesHint")}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 4. Tổng số mã QR */}
        {canReadQrCodes ? (
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                <QrCode className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {t("kpiQrTitle")}
                </p>
                <h3 className="text-foreground text-lg font-extrabold tracking-tight whitespace-nowrap sm:text-xl">
                  {qrCodesQuery.isLoading ? <Skeleton className="h-7 w-16" /> : totalQrCount}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-[11px]">{t("kpiQrHint")}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Tabs chuyên đề */}
      <Tabs value={effectiveTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 grid w-full grid-cols-2 p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview" className="gap-2 text-xs">
            <LayoutDashboard className="size-3.5" />
            <span>{t("tabs.overview")}</span>
          </TabsTrigger>
          {canReadDonations ? (
            <TabsTrigger value="donations" className="gap-2 text-xs">
              <HeartHandshake className="size-3.5" />
              <span>{t("tabs.donations")}</span>
            </TabsTrigger>
          ) : null}
          {canReadShortLinks ? (
            <TabsTrigger value="links" className="gap-2 text-xs">
              <Link2 className="size-3.5" />
              <span>{t("tabs.links")}</span>
            </TabsTrigger>
          ) : null}
          {canReadPages ? (
            <TabsTrigger value="pages" className="gap-2 text-xs">
              <FileText className="size-3.5" />
              <span>{t("tabs.pages")}</span>
            </TabsTrigger>
          ) : null}
        </TabsList>

        {/* Tab 1: Tổng quan chung */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top link nhiều click */}
            {canReadShortLinks ? (
              <Card className="border-border bg-card shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{t("topLinksTitle")}</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                    <Link href={UTILITIES_ROUTES.shortLinks}>
                      <span>{t("viewAll")}</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {topLinks.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      {t("emptyLinks")}
                    </p>
                  ) : (
                    topLinks.map((item) => (
                      <div
                        key={item.id}
                        className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 rounded-xl border p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{item.name || item.slug}</p>
                          <p className="text-muted-foreground truncate font-mono text-[11px]">
                            /{item.slug}
                          </p>
                        </div>
                        <Badge variant="secondary" className="gap-1 font-mono text-xs">
                          <MousePointerClick className="size-3" />
                          <span>{format.number(item.clicksCount ?? 0)}</span>
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Trang tùy chỉnh mới tạo */}
            {canReadPages ? (
              <Card className="border-border bg-card shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{t("recentPagesTitle")}</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                    <Link href={UTILITIES_ROUTES.pages}>
                      <span>{t("managePages")}</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {recentPages.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      {t("emptyPages")}
                    </p>
                  ) : (
                    recentPages.map((page) => (
                      <div
                        key={page.id}
                        className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 rounded-xl border p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{page.title}</p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {t("ownerLabel", {
                              owner: page.owner?.fullName || page.owner?.email || "—",
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={page.status === "PUBLISHED" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {page.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Mã QR gần đây */}
            {canReadQrCodes && (!canReadShortLinks || !canReadPages) ? (
              <Card className="border-border bg-card shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{t("recentQrTitle")}</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                    <Link href={UTILITIES_ROUTES.qrCodes}>
                      <span>{t("viewAll")}</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {recentQrCodes.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">{t("emptyQr")}</p>
                  ) : (
                    recentQrCodes.map((qr) => (
                      <div
                        key={qr.id}
                        className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 rounded-xl border p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{qr.name}</p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {t("ownerLabel", {
                              owner: qr.owner?.fullName || qr.owner?.email || "—",
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {qr.qrType}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        {/* Tab 2: Quyên góp & SePay */}
        {canReadDonations ? (
          <TabsContent value="donations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Cơ cấu quà tặng quy đổi */}
              <Card className="border-border bg-card shadow-2xs">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Coffee className="size-4 text-amber-500" />
                    <span>{t("giftBreakdownTitle")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">{t("giftBreakdownDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {donationStats?.byGift && donationStats.byGift.length > 0 ? (
                    donationStats.byGift.map((g) => (
                      <div
                        key={g.gift_type}
                        className="border-border/60 flex items-center justify-between rounded-lg border p-2 text-xs"
                      >
                        <span className="font-medium">{g.gift_label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-[11px]">
                            {t("giftCount", { count: g.count })}
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {format.number(g.total)} {CURRENCY_SYMBOLS.VND}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      {t("emptyDonations")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cảnh báo kiểm duyệt từ ngữ xấu */}
              <Card className="border-border bg-card shadow-2xs">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <ShieldAlert className="size-4 text-rose-500" />
                    <span>{t("censoredTitle")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">{t("censoredDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {censoredDonations.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center text-xs">
                      <Sparkles className="mb-1 size-6 text-emerald-500" />
                      <p>{t("noCensoredComments")}</p>
                    </div>
                  ) : (
                    censoredDonations.map((tx) => (
                      <div
                        key={tx.id}
                        className="space-y-1 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-700 dark:text-rose-400">
                            {tx.pageTitle} • {format.number(tx.amount)} {CURRENCY_SYMBOLS.VND}
                          </span>
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                            {t("censoredBadge")}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground font-mono text-[11px]">
                          {t("originalContent", { content: tx.originalContent })}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-2">
              <Button asChild className="gap-1.5">
                <Link href={UTILITIES_ROUTES.donations}>
                  <HeartHandshake className="size-4" />
                  <span>{t("viewAllDonations")}</span>
                </Link>
              </Button>
            </div>
          </TabsContent>
        ) : null}

        {/* Tab 3: Link rút gọn */}
        {canReadShortLinks ? (
          <TabsContent value="links">
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{t("linksTabTitle")}</CardTitle>
                  <CardDescription className="text-xs">{t("linksTabDesc")}</CardDescription>
                </div>
                <Button asChild size="sm" className="gap-1 text-xs">
                  <Link href={UTILITIES_ROUTES.shortLinks}>
                    <span>{t("viewLinksList")}</span>
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>
        ) : null}

        {/* Tab 4: Trang tùy chỉnh */}
        {canReadPages ? (
          <TabsContent value="pages">
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{t("pagesTabTitle")}</CardTitle>
                  <CardDescription className="text-xs">{t("pagesTabDesc")}</CardDescription>
                </div>
                <Button asChild size="sm" className="gap-1 text-xs">
                  <Link href={UTILITIES_ROUTES.pages}>
                    <span>{t("viewPagesList")}</span>
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
