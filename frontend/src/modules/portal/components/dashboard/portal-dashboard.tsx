"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Heart,
  Link2,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { pageService } from "@/modules/utilities/services/page.service";
import { shortLinkService } from "@/modules/utilities/services/short-link.service";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shares/components/ui/card";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component Tổng quan không gian cá nhân (Portal Dashboard).
 *
 * @returns Giao diện Dashboard.
 */
export function PortalDashboard() {
  const t = useTranslations("portal.dashboard");
  const tActions = useTranslations("common.actions");
  const tPages = useTranslations("portal.pages");
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user.id;

  // Chỉ tải trang và link do chính user tạo
  const pagesQuery = useQuery({
    queryKey: ["portal-dashboard-pages", userId],
    queryFn: () => pageService.list({ owner: userId ? [userId] : undefined, pageSize: 5 }),
    enabled: Boolean(userId),
  });

  const linksQuery = useQuery({
    queryKey: ["portal-dashboard-links", userId],
    queryFn: () => shortLinkService.list({ owner: userId ? [userId] : undefined, pageSize: 5 }),
    enabled: Boolean(userId),
  });

  const pages = (pagesQuery.data?.items ?? []).filter((p) => !userId || p.owner.id === userId);
  const totalPages = pages.length;

  const links = (linksQuery.data?.items ?? []).filter((l) => !userId || l.owner.id === userId);
  const totalLinks = links.length;

  const totalClicks = links.reduce((sum, item) => sum + (item.clicksCount ?? 0), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="border-border from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-r p-6 shadow-2xs sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>{t("studioBadge")}</span>
          </div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("welcome", { name: currentUser?.user.fullName || currentUser?.user.email || "" })}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">{t("stats.totalPages")}</p>
              <h3 className="text-foreground text-2xl font-extrabold">{totalPages}</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("stats.totalPagesHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Link2 className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                {t("stats.totalShortLinks")}
              </p>
              <h3 className="text-foreground text-2xl font-extrabold">{totalLinks}</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("stats.totalShortLinksHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MousePointerClick className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">{t("stats.totalClicks")}</p>
              <h3 className="text-foreground text-2xl font-extrabold">{totalClicks}</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {t("stats.totalClicksHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-foreground mb-4 text-base font-bold tracking-tight">
          {t("quickActions.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1: Link-in-Bio */}
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

          {/* Action 2: Affiliate Storefront */}
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

          {/* Action 3: Donation VietQR */}
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

          {/* Action 4: Short Link */}
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
        </div>
      </div>

      {/* Recents: Pages & Short Links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Pages */}
        <Card className="border-border bg-card rounded-2xl shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-foreground text-sm font-bold">{t("recentPages")}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-7 gap-1 text-xs">
              <Link href={PORTAL_ROUTES.pages}>
                <span>{t("viewAll")}</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">{t("emptyPages")}</p>
            ) : (
              <div className="divide-border divide-y">
                {pages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 pr-3">
                      <p className="text-foreground truncate text-xs font-semibold">{p.title}</p>
                      <p className="text-muted-foreground truncate font-mono text-[11px]">
                        {p.publicUrl}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy(p.publicUrl)}
                        title={tPages("copyLink")}
                        className="size-7"
                      >
                        <Link2 className="size-3.5" />
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-xs"
                        className="size-7"
                        title={tPages("view")}
                      >
                        <NextLink href={p.publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </NextLink>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                        <Link href={PORTAL_ROUTES.pageDetail(p.id)}>{tActions("edit")}</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Links */}
        <Card className="border-border bg-card rounded-2xl shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-foreground text-sm font-bold">{t("recentLinks")}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-7 gap-1 text-xs">
              <Link href={PORTAL_ROUTES.shortLinks}>
                <span>{t("viewAll")}</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">{t("emptyLinks")}</p>
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
                      <Badge variant="secondary" className="gap-1 px-2 py-0 font-mono text-[10px]">
                        <MousePointerClick className="size-3" />
                        <span>{l.clicksCount ?? 0}</span>
                      </Badge>
                      <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                        <Link href={PORTAL_ROUTES.shortLinkDetail(l.id)}>{tActions("edit")}</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
