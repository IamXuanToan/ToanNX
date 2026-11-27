"use client";

import {
  Heart,
  Laptop,
  Maximize2,
  Package,
  PlusCircle,
  Smartphone,
  Sparkles,
  Tablet,
  UserCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shares/components/ui/dialog";
import { CURRENCY_CODES } from "@/shares/constants/currency";
import { formatVndText, getNumberLocale } from "@/shares/lib/number-format";

import {
  DEMO_TEMPLATE_TYPE,
  type DemoTemplateTypeValue,
  PAGE_TYPE,
} from "../../constants/page-constants";
import { UTILITIES_ROUTES } from "../../constants/routes";
import type { PublicPage as PublicPageType } from "../../types/page.types";
import { PublicPage } from "./public-page";

const DEFAULT_CONTENT = { type: "doc" as const, content: [{ type: "paragraph" as const }] };

function createDemoPage(
  data: Partial<PublicPageType> & { title: string; pageType: PublicPageType["pageType"] },
): PublicPageType {
  return {
    segment: "p",
    slug: data.slug ?? "demo",
    status: "PUBLISHED",
    preview: true,
    title: data.title,
    description: data.description ?? "",
    canonicalUrl: data.canonicalUrl ?? "https://toannx.com/demo",
    seoTitle: data.seoTitle ?? data.title,
    seoDescription: data.seoDescription ?? data.description ?? "",
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    theme: data.theme ?? { mode: "system", primaryColor: "#3D812E", buttonStyle: "rounded" },
    pageType: data.pageType,
    templateKey: data.templateKey ?? "default",
    templateVersion: 1,
    contentConfig: data.contentConfig ?? {},
    styleConfig: data.styleConfig ?? {},
    responsiveConfig: data.responsiveConfig ?? {},
    content: data.content ?? DEFAULT_CONTENT,
  };
}

/**
 * Trình diễn trực tiếp các mẫu template (Affiliate, Bio, Donation).
 *
 * @returns Component showcase.
 */
export function TemplateDemoShowcase({
  type = DEMO_TEMPLATE_TYPE.AFFILIATE,
}: {
  type?: DemoTemplateTypeValue;
}) {
  const t = useTranslations("utilities.customPages.demo");
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);
  const currentTemplate = type;
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [fullModalOpen, setFullModalOpen] = useState(false);

  const activePage = useMemo<PublicPageType>(() => {
    if (currentTemplate === DEMO_TEMPLATE_TYPE.AFFILIATE) {
      return createDemoPage({
        slug: "demo-affiliate",
        title: t("showcase.affiliate.title"),
        description: t("showcase.affiliate.description"),
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&h=500&q=85",
        coverUrl:
          "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1600&h=600&q=85",
        pageType: PAGE_TYPE.AFFILIATE,
        templateKey: "product_grid",
        theme: {
          mode: "system",
          primaryColor: "#3D812E",
          buttonStyle: "rounded",
        },
        styleConfig: {
          primaryColor: "#3D812E",
          cardRadius: "12px",
          layout: "grid",
          showSearch: true,
          showPrice: true,
          showImage: true,
        },
        responsiveConfig: {
          desktopColumns: 3,
          tabletColumns: 2,
          mobileColumns: 2,
        },
        contentConfig: {
          categories: [
            {
              id: "all",
              name: t("showcase.affiliate.catAll"),
              slug: "all",
              sortOrder: 0,
              isVisible: true,
            },
            {
              id: "keyboard",
              name: t("showcase.affiliate.catKeyboard"),
              slug: "keyboard",
              sortOrder: 1,
              isVisible: true,
            },
            {
              id: "audio",
              name: t("showcase.affiliate.catAudio"),
              slug: "audio",
              sortOrder: 2,
              isVisible: true,
            },
            {
              id: "accessories",
              name: t("showcase.affiliate.catAccessories"),
              slug: "accessories",
              sortOrder: 3,
              isVisible: true,
            },
          ],
          items: [
            {
              id: "item-1",
              displayMode: "product",
              title: t("showcase.affiliate.item1Title"),
              description: t("showcase.affiliate.item1Desc"),
              categoryId: "keyboard",
              destinationUrl: "https://shopee.vn",
              platform: "shopee",
              imageUrl:
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=600&q=85",
              priceConfig: {
                mode: "fixed",
                amount: 2850000,
                originalAmount: 3200000,
                currency: CURRENCY_CODES.VND,
              },
              buttonConfig: { label: t("showcase.affiliate.item1Btn"), openInNewTab: true },
              badge: { text: t("showcase.affiliate.item1Badge"), tone: "hot" },
              isFeatured: true,
              sortOrder: 1,
              isVisible: true,
            },
            {
              id: "item-2",
              displayMode: "product",
              title: t("showcase.affiliate.item2Title"),
              description: t("showcase.affiliate.item2Desc"),
              categoryId: "keyboard",
              destinationUrl: "https://lazada.vn",
              platform: "lazada",
              imageUrl:
                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&h=600&q=85",
              priceConfig: {
                mode: "fixed",
                amount: 2190000,
                originalAmount: 2490000,
                currency: CURRENCY_CODES.VND,
              },
              buttonConfig: { label: t("showcase.affiliate.item2Btn"), openInNewTab: true },
              badge: { text: t("showcase.affiliate.item2Badge"), tone: "sale" },
              isFeatured: true,
              sortOrder: 2,
              isVisible: true,
            },
            {
              id: "item-3",
              displayMode: "product",
              title: t("showcase.affiliate.item3Title"),
              description: t("showcase.affiliate.item3Desc"),
              categoryId: "audio",
              destinationUrl: "https://tiki.vn",
              platform: "tiki",
              imageUrl:
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=85",
              priceConfig: {
                mode: "fixed",
                amount: 6990000,
                currency: CURRENCY_CODES.VND,
              },
              buttonConfig: { label: t("showcase.affiliate.item3Btn"), openInNewTab: true },
              sortOrder: 3,
              isVisible: true,
            },
            {
              id: "item-4",
              displayMode: "product",
              title: t("showcase.affiliate.item4Title"),
              description: t("showcase.affiliate.item4Desc"),
              categoryId: "accessories",
              destinationUrl: "https://shopee.vn",
              platform: "shopee",
              imageUrl:
                "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&h=600&q=85",
              priceConfig: {
                mode: "fixed",
                amount: 2650000,
                currency: CURRENCY_CODES.VND,
              },
              buttonConfig: { label: t("showcase.affiliate.item4Btn"), openInNewTab: true },
              sortOrder: 4,
              isVisible: true,
            },
          ],
        },
      });
    }
    if (currentTemplate === DEMO_TEMPLATE_TYPE.BIO) {
      return createDemoPage({
        slug: "demo-bio",
        title: t("showcase.bio.title"),
        description: t("showcase.bio.description"),
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=500&q=85",
        coverUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&h=600&q=85",
        pageType: PAGE_TYPE.BIO,
        templateKey: "link_in_bio",
        theme: {
          mode: "system",
          primaryColor: "#4F46E5",
          buttonStyle: "pill",
        },
        contentConfig: {
          profile: {
            displayName: t("showcase.bio.title"),
            headline: t("showcase.bio.headline"),
            bioText: t("showcase.bio.bioText"),
            location: t("showcase.bio.location"),
            email: "contact@toannx.com",
            website: "https://toannx.com",
          },
          experiences: [
            {
              id: "exp-1",
              company: "ToanNX Technology",
              role: "Lead Software Architect",
              period: t("showcase.bio.exp1Period"),
              description: t("showcase.bio.exp1Desc"),
            },
            {
              id: "exp-2",
              company: "VNG Corporation",
              role: "Senior Frontend Engineer",
              period: "2021 - 2023",
              description: t("showcase.bio.exp2Desc"),
            },
          ],
          skills: [
            { id: "sk-1", name: "Next.js 16", level: t("showcase.bio.levelAdvanced") },
            { id: "sk-2", name: "Django & Python", level: t("showcase.bio.levelAdvanced") },
            { id: "sk-3", name: "TypeScript", level: t("showcase.bio.levelProficient") },
            { id: "sk-4", name: "PostgreSQL & Neon", level: t("showcase.bio.levelProficient") },
            { id: "sk-5", name: "Tailwind CSS", level: t("showcase.bio.levelProficient") },
            { id: "sk-6", name: "Docker & Cloudflare", level: t("showcase.bio.levelProficient") },
          ],
          projects: [
            {
              id: "proj-1",
              title: "ToanNX Platform",
              description: t("showcase.bio.proj1Desc"),
              url: "https://github.com",
              tags: ["Next.js", "Django", "PostgreSQL", "Tailwind"],
            },
            {
              id: "proj-2",
              title: "Antigravity Dev Agent",
              description: t("showcase.bio.proj2Desc"),
              url: "https://github.com",
              tags: ["AI Agent", "Python", "Automation"],
            },
          ],
          links: [
            {
              id: "l-1",
              title: t("showcase.bio.link1Title"),
              description: t("showcase.bio.link1Desc"),
              url: "https://github.com",
              highlight: true,
              sortOrder: 1,
              isVisible: true,
            },
            {
              id: "l-2",
              title: t("showcase.bio.link2Title"),
              description: t("showcase.bio.link2Desc"),
              url: "https://linkedin.com",
              highlight: false,
              sortOrder: 2,
              isVisible: true,
            },
          ],
        },
      });
    }
    return createDemoPage({
      slug: "demo-donation",
      title: t("showcase.donation.title"),
      description: t("showcase.donation.description"),
      avatarUrl:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&h=500&q=85",
      coverUrl:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&h=600&q=85",
      pageType: PAGE_TYPE.DONATION,
      templateKey: "donate",
      theme: {
        mode: "system",
        primaryColor: "#EA580C",
        buttonStyle: "rounded",
      },
      contentConfig: {
        creator: {
          name: t("showcase.donation.creatorName"),
          message: t("showcase.donation.message"),
          thankYouMessage: t("showcase.donation.thankYouMessage"),
        },
        bankAccount: {
          bankName: "MBBank",
          accountNumber: "9999999999",
          accountHolder: "NGUYEN XUAN TOAN",
        },
        suggestedAmounts: [
          {
            amount: 30000,
            label: t("showcase.donation.amountCoffee", {
              amount: formatVndText(30000, numberLocale),
            }),
            icon: "coffee",
          },
          {
            amount: 50000,
            label: t("showcase.donation.amountBreakfast", {
              amount: formatVndText(50000, numberLocale),
            }),
            icon: "utensils",
          },
          {
            amount: 100000,
            label: t("showcase.donation.amountBook", {
              amount: formatVndText(100000, numberLocale),
            }),
            icon: "book",
          },
          { amount: 200000, label: t("showcase.donation.amountServer"), icon: "server" },
        ],
      },
    });
  }, [currentTemplate, numberLocale, t]);

  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Thanh Header điều khiển Studio */}
      <header className="border-border bg-card/90 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 border-b px-3 py-2.5 shadow-2xs backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-foreground text-sm font-bold tracking-tight">ToanNX</span>
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
              <Sparkles className="text-primary size-3" />
              <span>{t("liveShowcase")}</span>
            </Badge>
          </Link>
        </div>

        {/* Bộ chuyển đổi template — cuộn ngang an toàn trên mobile 375px */}
        <div className="border-border bg-muted/40 order-3 flex w-full max-w-full scrollbar-none items-center gap-1 overflow-x-auto rounded-xl border p-1 shadow-inner lg:order-none lg:w-auto">
          <Button
            type="button"
            size="sm"
            variant={currentTemplate === DEMO_TEMPLATE_TYPE.AFFILIATE ? "default" : "ghost"}
            asChild
            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          >
            <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.AFFILIATE)}>
              <Package className="size-3.5" />
              <span>{t("affiliate")}</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentTemplate === DEMO_TEMPLATE_TYPE.BIO ? "default" : "ghost"}
            asChild
            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          >
            <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.BIO)}>
              <UserCheck className="size-3.5" />
              <span>{t("bio")}</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentTemplate === DEMO_TEMPLATE_TYPE.DONATION ? "default" : "ghost"}
            asChild
            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          >
            <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.DONATION)}>
              <Heart className="size-3.5" />
              <span>{t("donation")}</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            asChild
            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          >
            <Link href={UTILITIES_ROUTES.demoEditor}>
              <Sparkles className="text-primary size-3.5" />
              <span>{t("notionEditor")}</span>
            </Link>
          </Button>
        </div>

        {/* Thiết bị & CTA */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="border-border bg-background hidden items-center rounded-lg border p-0.5 shadow-2xs sm:flex">
            <AppTooltip content={t("mobile")}>
              <Button
                type="button"
                size="sm"
                variant={device === "mobile" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="size-3.5" />
              </Button>
            </AppTooltip>
            <AppTooltip content={t("tablet")}>
              <Button
                type="button"
                size="sm"
                variant={device === "tablet" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setDevice("tablet")}
              >
                <Tablet className="size-3.5" />
              </Button>
            </AppTooltip>
            <AppTooltip content={t("desktop")}>
              <Button
                type="button"
                size="sm"
                variant={device === "desktop" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setDevice("desktop")}
              >
                <Laptop className="size-3.5" />
              </Button>
            </AppTooltip>
          </div>

          <AppTooltip content={t("fullscreen")}>
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              onClick={() => setFullModalOpen(true)}
              className="size-8 rounded-lg"
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </AppTooltip>

          <Button asChild size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
            <Link href={UTILITIES_ROUTES.pageCreate}>
              <PlusCircle className="size-3.5" />
              <span>{t("createPage")}</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Vùng Canvas hiển thị giao diện */}
      <main className="bg-muted/20 flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto p-2.5 sm:p-8">
        <div className="w-full max-w-5xl">
          {device === "mobile" ? (
            /* Mockup Điện thoại iPhone */
            <div className="bg-background relative mx-auto flex w-[375px] max-w-full flex-col overflow-hidden rounded-3xl border-4 border-neutral-900 shadow-2xl transition-all duration-300 sm:rounded-[2.5rem] sm:border-[8px] dark:border-neutral-800">
              <div className="absolute top-2 left-1/2 z-20 h-3.5 w-24 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-800" />
              <div className="h-[680px] overflow-y-auto pt-6">
                <PublicPage page={activePage} />
              </div>
              <div className="bg-background/80 relative flex h-3.5 w-full items-center justify-center backdrop-blur-xs">
                <div className="bg-foreground/20 h-1 w-24 rounded-full" />
              </div>
            </div>
          ) : device === "tablet" ? (
            /* Mockup Tablet iPad */
            <div className="bg-background relative mx-auto flex w-[720px] max-w-full flex-col overflow-hidden rounded-2xl border-[8px] border-neutral-900 shadow-xl transition-all duration-300 dark:border-neutral-800">
              <div className="h-[720px] overflow-y-auto">
                <PublicPage page={activePage} />
              </div>
            </div>
          ) : (
            /* Mockup Desktop Browser */
            <div className="border-border bg-background relative mx-auto flex w-full flex-col overflow-hidden rounded-xl border shadow-lg transition-all duration-300">
              <div className="border-border bg-muted/60 flex items-center gap-1.5 border-b px-4 py-2">
                <div className="size-2.5 rounded-full bg-red-400/80" />
                <div className="size-2.5 rounded-full bg-amber-400/80" />
                <div className="size-2.5 rounded-full bg-emerald-400/80" />
                <div className="bg-background/80 text-muted-foreground mx-auto max-w-md truncate rounded-md px-3 py-0.5 font-mono text-[11px]">
                  toannx.com/demo/{currentTemplate}
                </div>
              </div>
              <div className="max-h-[750px] min-h-[550px] overflow-y-auto">
                <PublicPage page={activePage} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal xem trước toàn màn hình */}
      <Dialog open={fullModalOpen} onOpenChange={setFullModalOpen}>
        <DialogContent className="flex h-[95vh] max-w-7xl flex-col overflow-hidden p-0">
          <div className="bg-muted/40 flex shrink-0 items-center justify-between border-b px-4 py-2.5">
            <DialogTitle className="text-sm font-semibold">
              {t("livePreviewTitle", { title: activePage.title })}
            </DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PublicPage page={activePage} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
