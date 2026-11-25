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
import { Link } from "@/i18n/navigation";
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
import { useTabState } from "@/shares/hooks/use-tab-state";

import { donationKeys, pageKeys, qrCodeKeys, shortLinkKeys } from "../../constants/query-keys";
import { UTILITIES_ROUTES } from "../../constants/routes";
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
  const [activeTab, setActiveTab] = useTabState({
    validTabs: ["overview", "donations", "links", "pages"] as const,
    defaultTab: "overview",
  });

  // Truy vấn thống kê quyên góp toàn sàn
  const donationStatsQuery = useQuery({
    queryKey: donationKeys.stats(),
    queryFn: () => donationService.stats(),
  });

  // Truy vấn top links rút gọn
  const shortLinksQuery = useQuery({
    queryKey: [...shortLinkKeys.lists(), "top-clicks"],
    queryFn: () => shortLinkService.list({ pageSize: 5, ordering: "-clicks_count" }),
  });

  // Truy vấn trang mới tạo
  const pagesQuery = useQuery({
    queryKey: [...pageKeys.lists(), "recent"],
    queryFn: () => pageService.list({ pageSize: 5, ordering: "-created_at" }),
  });

  // Truy vấn mã QR
  const qrCodesQuery = useQuery({
    queryKey: [...qrCodeKeys.lists(), "recent"],
    queryFn: () => qrCodeService.list({ pageSize: 5, ordering: "-created_at" }),
  });

  // Truy vấn bình luận quyên góp bị kiểm duyệt vi phạm từ ngữ
  const censoredDonationsQuery = useQuery({
    queryKey: [...donationKeys.lists(), "censored"],
    queryFn: () => donationService.list({ isCensored: true, pageSize: 5 }),
  });

  const donationStats = donationStatsQuery.data;
  const topLinks = shortLinksQuery.data?.items ?? [];
  const recentPages = pagesQuery.data?.items ?? [];
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
            <span>Thống kê Quản trị Toàn sàn</span>
          </div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            Tổng quan Module Tiện ích
          </h1>
          <p className="text-muted-foreground text-sm">
            Theo dõi lưu lượng link rút gọn, quyên góp ủng hộ SePay, mã QR và các trang tùy chỉnh
            toàn hệ thống.
          </p>
        </div>
      </div>

      {/* KPI Cards Hàng Ngang */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Tổng tiền quyên góp */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Coins className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                Tổng tiền quyên góp
              </p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {donationStats ? (
                  `${donationStats.totalAmount.toLocaleString("vi-VN")} ₫`
                ) : (
                  <Skeleton className="h-7 w-24" />
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {donationStats?.totalCount ?? 0} lượt ủng hộ thành công
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Tổng click link */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <MousePointerClick className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">
                Lượt click link ngắn
              </p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {shortLinksQuery.isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  totalClicks.toLocaleString("vi-VN")
                )}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {shortLinksQuery.data?.pagination?.total ?? 0} liên kết đang chạy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Tổng số trang tùy chỉnh */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <FileText className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">Trang tùy chỉnh</p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {pagesQuery.isLoading ? <Skeleton className="h-7 w-16" /> : totalPagesCount}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">Bio, Donate, Tiếp thị...</p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Tổng số mã QR */}
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <QrCode className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">Mã QR đã tạo</p>
              <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">
                {qrCodesQuery.isLoading ? <Skeleton className="h-7 w-16" /> : totalQrCount}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">VietQR & Mã tùy chỉnh</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs chuyên đề */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 grid w-full grid-cols-2 p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview" className="gap-2 text-xs">
            <LayoutDashboard className="size-3.5" />
            <span>Tổng quan chung</span>
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-2 text-xs">
            <HeartHandshake className="size-3.5" />
            <span>Quyên góp & SePay</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2 text-xs">
            <Link2 className="size-3.5" />
            <span>Link rút gọn</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2 text-xs">
            <FileText className="size-3.5" />
            <span>Trang tùy chỉnh</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tổng quan chung */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top link nhiều click */}
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                  Top Link rút gọn nhiều click
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                  <Link href={UTILITIES_ROUTES.shortLinks}>
                    <span>Xem tất cả</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {topLinks.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-xs">
                    Chưa có liên kết nào
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
                        <span>{item.clicksCount?.toLocaleString("vi-VN") ?? 0}</span>
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Trang tùy chỉnh mới tạo */}
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Trang tùy chỉnh gần đây</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                  <Link href={UTILITIES_ROUTES.pages}>
                    <span>Quản lý trang</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {recentPages.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-xs">
                    Chưa có trang nào
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
                          Chủ: {page.owner?.fullName || page.owner?.email || "—"}
                        </p>
                      </div>
                      <Badge
                        variant={page.status === "PUBLISHED" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {page.status === "PUBLISHED" ? "Công khai" : "Bản nháp"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Quyên góp & SePay */}
        <TabsContent value="donations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cơ cấu quà tặng quy đổi */}
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Coffee className="size-4 text-amber-500" />
                  <span>Cơ cấu Quà tặng Quy đổi</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Tỷ lệ các mốc quà ủng hộ (ly cà phê, gói mì tôm, bữa sáng...)
                </CardDescription>
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
                        <span className="text-muted-foreground text-[11px]">{g.count} lượt</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {g.total.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-xs">
                    Chưa có giao dịch quyên góp nào
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cảnh báo kiểm duyệt từ ngữ xấu */}
            <Card className="border-border bg-card shadow-2xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ShieldAlert className="size-4 text-rose-500" />
                  <span>Bình luận cần rà soát kiểm duyệt</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Các lời nhắn bị bộ lọc Regex tự động đánh dấu vi phạm từ ngữ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {censoredDonations.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-center text-xs">
                    <Sparkles className="mb-1 size-6 text-emerald-500" />
                    <p>Không có bình luận nào vi phạm từ ngữ</p>
                  </div>
                ) : (
                  censoredDonations.map((tx) => (
                    <div
                      key={tx.id}
                      className="space-y-1 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-700 dark:text-rose-400">
                          {tx.pageTitle} • {tx.amount.toLocaleString("vi-VN")} ₫
                        </span>
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          Vi phạm từ ngữ
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        Nội dung gốc: &quot;{tx.originalContent}&quot;
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
                <span>Xem toàn bộ lịch sử quyên góp</span>
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Link rút gọn */}
        <TabsContent value="links">
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Quản lý Link rút gọn</CardTitle>
                <CardDescription className="text-xs">
                  Toàn bộ liên kết ngắn trên hệ thống
                </CardDescription>
              </div>
              <Button asChild size="sm" className="gap-1 text-xs">
                <Link href={UTILITIES_ROUTES.shortLinks}>
                  <span>Xem danh sách link</span>
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Tab 4: Trang tùy chỉnh */}
        <TabsContent value="pages">
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Quản lý Trang tùy chỉnh</CardTitle>
                <CardDescription className="text-xs">
                  Trang Bio, Donate, Tiếp thị liên kết
                </CardDescription>
              </div>
              <Button asChild size="sm" className="gap-1 text-xs">
                <Link href={UTILITIES_ROUTES.pages}>
                  <span>Xem danh sách trang</span>
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
