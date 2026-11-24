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
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shares/components/ui/dialog";

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

const DEMO_AFFILIATE_PAGE: PublicPageType = createDemoPage({
  slug: "demo-affiliate",
  title: "Toan Tech Setup & Gear",
  description:
    "Tuyển tập những thiết bị công nghệ, bàn phím cơ và đồ decor góc làm việc mình tâm đắc nhất.",
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
      { id: "all", name: "Tất cả", slug: "all", sortOrder: 0, isVisible: true },
      {
        id: "keyboard",
        name: "Bàn phím cơ & Chuột",
        slug: "keyboard",
        sortOrder: 1,
        isVisible: true,
      },
      { id: "audio", name: "Tai nghe & Âm thanh", slug: "audio", sortOrder: 2, isVisible: true },
      {
        id: "accessories",
        name: "Phụ kiện góc setup",
        slug: "accessories",
        sortOrder: 3,
        isVisible: true,
      },
    ],
    items: [
      {
        id: "item-1",
        displayMode: "product",
        title: "Bàn phím cơ không dây NuPhy Air75 V2",
        description: "Bàn phím low-profile gõ cực êm, kết nối đa thiết bị Bluetooth 5.1 và 2.4Ghz.",
        categoryId: "keyboard",
        destinationUrl: "https://shopee.vn",
        platform: "shopee",
        imageUrl:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=600&q=85",
        priceConfig: {
          mode: "fixed",
          amount: 2850000,
          originalAmount: 3200000,
          currency: "VND",
        },
        buttonConfig: { label: "Mua trên Shopee", openInNewTab: true },
        badge: { text: "YÊU THÍCH", tone: "hot" },
        isFeatured: true,
        sortOrder: 1,
        isVisible: true,
      },
      {
        id: "item-2",
        displayMode: "product",
        title: "Chuột không dây Logitech MX Master 3S",
        description: "Chuột công thái học cuộn vô cực siêu êm, độ nhạy 8000 DPI cho dân lập trình.",
        categoryId: "keyboard",
        destinationUrl: "https://lazada.vn",
        platform: "lazada",
        imageUrl:
          "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&h=600&q=85",
        priceConfig: {
          mode: "fixed",
          amount: 2190000,
          originalAmount: 2490000,
          currency: "VND",
        },
        buttonConfig: { label: "Mua trên Lazada", openInNewTab: true },
        badge: { text: "GIẢM 15%", tone: "sale" },
        isFeatured: true,
        sortOrder: 2,
        isVisible: true,
      },
      {
        id: "item-3",
        displayMode: "product",
        title: "Tai nghe chống ồn Sony WH-1000XM5",
        description: "Khử tiếng ồn đỉnh cao, thời lượng pin 30 giờ, đàm thoại trong trẻo.",
        categoryId: "audio",
        destinationUrl: "https://tiki.vn",
        platform: "tiki",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=85",
        priceConfig: {
          mode: "fixed",
          amount: 6990000,
          currency: "VND",
        },
        buttonConfig: { label: "Xem tại Tiki", openInNewTab: true },
        sortOrder: 3,
        isVisible: true,
      },
      {
        id: "item-4",
        displayMode: "product",
        title: "Đèn treo màn hình chống mỏi mắt BenQ ScreenBar",
        description: "Cảm biến ánh sáng tự động, không gây chói mắt và tiết kiệm diện tích bàn.",
        categoryId: "accessories",
        destinationUrl: "https://shopee.vn",
        platform: "shopee",
        imageUrl:
          "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&h=600&q=85",
        priceConfig: {
          mode: "fixed",
          amount: 2650000,
          currency: "VND",
        },
        buttonConfig: { label: "Mua ngay", openInNewTab: true },
        sortOrder: 4,
        isVisible: true,
      },
    ],
  },
});

const DEMO_BIO_PAGE: PublicPageType = createDemoPage({
  slug: "demo-bio",
  title: "Nguyễn Xuân Toàn",
  description: "Senior Fullstack Engineer & Open-source Enthusiast",
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
      displayName: "Nguyễn Xuân Toàn",
      headline: "Senior Fullstack Engineer & Tech Lead",
      bioText:
        "Hơn 6 năm kinh nghiệm thiết kế kiến trúc và phát triển các hệ thống web quy mô lớn bằng Python, Django, Next.js và Cloud Native.",
      location: "Hà Nội, Việt Nam",
      email: "contact@toannx.com",
      website: "https://toannx.com",
    },
    experiences: [
      {
        id: "exp-1",
        company: "ToanNX Technology",
        role: "Lead Software Architect",
        period: "2023 - Hiện tại",
        description:
          "Chịu trách nhiệm thiết kế nền tảng microservices, tối ưu hóa cơ sở dữ liệu và AI Agent.",
      },
      {
        id: "exp-2",
        company: "VNG Corporation",
        role: "Senior Frontend Engineer",
        period: "2021 - 2023",
        description:
          "Phát triển các ứng dụng trải nghiệm cao cho hàng triệu người dùng hoạt động hàng ngày.",
      },
    ],
    skills: [
      { id: "sk-1", name: "Next.js 16", level: "Chuyên sâu" },
      { id: "sk-2", name: "Django & Python", level: "Chuyên sâu" },
      { id: "sk-3", name: "TypeScript", level: "Thành thạo" },
      { id: "sk-4", name: "PostgreSQL & Neon", level: "Thành thạo" },
      { id: "sk-5", name: "Tailwind CSS", level: "Thành thạo" },
      { id: "sk-6", name: "Docker & Cloudflare", level: "Thành thạo" },
    ],
    projects: [
      {
        id: "proj-1",
        title: "ToanNX Platform",
        description:
          "Monorepo fullstack tích hợp quản trị phân quyền đa tầng, link rút gọn, mã QR và website template.",
        url: "https://github.com",
        tags: ["Next.js", "Django", "PostgreSQL", "Tailwind"],
      },
      {
        id: "proj-2",
        title: "Antigravity Dev Agent",
        description:
          "Bộ tác tử thông minh tự động hóa phân tích codebase và thực thi luồng làm việc kỹ thuật cao.",
        url: "https://github.com",
        tags: ["AI Agent", "Python", "Automation"],
      },
    ],
    links: [
      {
        id: "l-1",
        title: "Dự án mã nguồn mở trên GitHub",
        description: "Khám phá các thư viện và dự án mình đang phát triển công khai.",
        url: "https://github.com",
        highlight: true,
        sortOrder: 1,
        isVisible: true,
      },
      {
        id: "l-2",
        title: "Kết nối trên LinkedIn",
        description: "Mạng lưới nghề nghiệp và cơ hội hợp tác kỹ thuật.",
        url: "https://linkedin.com",
        highlight: false,
        sortOrder: 2,
        isVisible: true,
      },
    ],
  },
});

const DEMO_DONATION_PAGE: PublicPageType = createDemoPage({
  slug: "demo-donation",
  title: "Ủng hộ dự án mã nguồn mở",
  description:
    "Tiếp thêm năng lượng để duy trì máy chủ và phát triển thêm nhiều công cụ miễn phí cho cộng đồng lập trình.",
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
      name: "Nguyễn Xuân Toàn",
      message:
        "Nếu các sản phẩm, tài liệu hoặc công cụ của mình giúp ích cho công việc của bạn, hãy mời mình một ly cafe nhé!",
      thankYouMessage: "Cảm ơn bạn rất nhiều vì sự đồng hành quý báu này!",
    },
    bankAccount: {
      bankName: "MBBank",
      accountNumber: "9999999999",
      accountHolder: "NGUYEN XUAN TOAN",
    },
    suggestedAmounts: [
      { amount: 30000, label: "1 ly cafe (30.000 ₫)", icon: "coffee" },
      { amount: 50000, label: "1 bữa sáng (50.000 ₫)", icon: "utensils" },
      { amount: 100000, label: "1 cuốn sách (100.000 ₫)", icon: "book" },
      { amount: 200000, label: "Tài trợ máy chủ 1 tháng", icon: "server" },
    ],
  },
});

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
  const currentTemplate = type;
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [fullModalOpen, setFullModalOpen] = useState(false);

  const activePage =
    currentTemplate === DEMO_TEMPLATE_TYPE.AFFILIATE
      ? DEMO_AFFILIATE_PAGE
      : currentTemplate === DEMO_TEMPLATE_TYPE.BIO
        ? DEMO_BIO_PAGE
        : DEMO_DONATION_PAGE;

  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Thanh Header điều khiển Studio */}
      <header className="border-border bg-card/90 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 shadow-2xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-foreground text-sm font-bold tracking-tight">ToanNX</span>
            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
              <Sparkles className="text-primary size-3" />
              <span>{t("liveShowcase")}</span>
            </Badge>
          </Link>
        </div>

        {/* Bộ chuyển đổi template */}
        <div className="border-border bg-muted/40 flex items-center rounded-xl border p-1 shadow-inner">
          <Button
            type="button"
            size="sm"
            variant={currentTemplate === DEMO_TEMPLATE_TYPE.AFFILIATE ? "default" : "ghost"}
            asChild
            className="h-7.5 gap-1.5 px-3 text-xs font-medium"
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
            className="h-7.5 gap-1.5 px-3 text-xs font-medium"
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
            className="h-7.5 gap-1.5 px-3 text-xs font-medium"
          >
            <Link href={UTILITIES_ROUTES.demoType(DEMO_TEMPLATE_TYPE.DONATION)}>
              <Heart className="size-3.5" />
              <span>{t("donation")}</span>
            </Link>
          </Button>
        </div>

        {/* Thiết bị & CTA */}
        <div className="flex items-center gap-2">
          <div className="border-border bg-background hidden items-center rounded-lg border p-0.5 shadow-2xs sm:flex">
            <Button
              type="button"
              size="sm"
              variant={device === "mobile" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setDevice("mobile")}
              title={t("mobile")}
            >
              <Smartphone className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={device === "tablet" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setDevice("tablet")}
              title={t("tablet")}
            >
              <Tablet className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={device === "desktop" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setDevice("desktop")}
              title={t("desktop")}
            >
              <Laptop className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            onClick={() => setFullModalOpen(true)}
            className="size-8 rounded-lg"
            title={t("fullscreen")}
          >
            <Maximize2 className="size-3.5" />
          </Button>

          <Button asChild size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
            <Link href={UTILITIES_ROUTES.pageCreate}>
              <PlusCircle className="size-3.5" />
              <span>{t("createPage")}</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Vùng Canvas hiển thị giao diện */}
      <main className="bg-muted/20 flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
        <div className="w-full max-w-5xl">
          {device === "mobile" ? (
            /* Mockup Điện thoại iPhone */
            <div className="bg-background relative mx-auto flex w-[375px] max-w-full flex-col overflow-hidden rounded-[2.5rem] border-[8px] border-neutral-900 shadow-2xl transition-all duration-300 dark:border-neutral-800">
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
