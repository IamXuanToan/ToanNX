"use client";

import { ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type CSSProperties, useMemo } from "react";
import { cn } from "cn";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { formatVndText } from "@/shares/lib/number-format";
import { toSafeHttpUrl, toSafeImageSrc } from "@/shares/lib/safe-url";

import type { AffiliateCategory, PublicPage } from "../../types/page.types";
import { useAffiliatePageRenderer } from "./hooks/use-affiliate-page-renderer";

const PLATFORM_STYLES: Record<string, string> = {
  shopee:
    "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50",
  lazada:
    "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50",
  tiktok:
    "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700",
  tiki: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50",
  amazon:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50",
  custom: "bg-muted text-muted-foreground border border-border/80",
};

/**
 * Hiển thị trang Tiếp thị Liên kết (Affiliate Storefront) công khai với đầy đủ chức năng tìm kiếm,
 * lọc danh mục, hỗ trợ 3 kiểu bố cục (Grid, List, Links) và tối ưu responsive chuẩn sàn TMĐT hiện đại.
 *
 * @param props - Dữ liệu trang công khai.
 * @returns Giao diện trang Affiliate.
 */
export function AffiliatePageRenderer({ page }: { page: PublicPage }) {
  const t = useTranslations("utilities.customPages.storefront");
  const {
    categories,
    filteredItems,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
  } = useAffiliatePageRenderer(page);

  const styleConfig = (page.styleConfig ?? {}) as Record<string, unknown>;
  const responsiveConfig = (page.responsiveConfig ?? {}) as Record<string, unknown>;
  const rawTheme = (page.theme ?? {}) as Record<string, unknown>;

  // Lọc bỏ danh mục người dùng tự tạo trùng tên "Tất cả" để tránh lặp 2 nút "Tất cả" đứng cạnh nhau
  const displayCategories = useMemo<AffiliateCategory[]>(() => {
    return categories.filter((cat) => {
      const clean = cat.name.trim().toLowerCase();
      return clean !== "tất cả" && clean !== "all" && clean !== "tat ca";
    });
  }, [categories]);

  const primaryColor =
    (rawTheme.primaryColor as string) ??
    (rawTheme.primary_color as string) ??
    (styleConfig.primaryColor as string) ??
    (styleConfig.primary_color as string) ??
    "#3D812E";
  const layout = (styleConfig.layout as string) ?? "grid";
  const showPrice = styleConfig.showPrice !== false && styleConfig.show_price !== false;
  const showImage = styleConfig.showImage !== false && styleConfig.show_image !== false;
  const showSearch = styleConfig.showSearch !== false && styleConfig.show_search !== false;

  const cardRadius = (styleConfig.cardRadius as string) ?? (styleConfig.card_radius as string);
  const cardRadiusClass =
    cardRadius === "0px"
      ? "rounded-none"
      : cardRadius === "4px"
        ? "rounded"
        : cardRadius === "20px"
          ? "rounded-2xl"
          : "rounded-xl";

  const buttonStyle =
    (rawTheme.buttonStyle as string) ?? (rawTheme.button_style as string) ?? "rounded";
  const buttonRadiusClass =
    buttonStyle === "square"
      ? "rounded-none"
      : buttonStyle === "pill"
        ? "rounded-full"
        : "rounded-xl";

  const themeMode = (rawTheme.mode as string) ?? "system";
  const bgRaw =
    (rawTheme.backgroundColor as string) ??
    (rawTheme.background_color as string) ??
    (styleConfig.backgroundColor as string) ??
    (styleConfig.background_color as string);
  const textRaw =
    (rawTheme.textColor as string) ??
    (rawTheme.text_color as string) ??
    (styleConfig.textColor as string) ??
    (styleConfig.text_color as string);

  const isLightHex = (hex?: string) => {
    if (!hex || !hex.startsWith("#") || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  };

  const isDark =
    themeMode === "dark" || (themeMode !== "light" && bgRaw ? !isLightHex(bgRaw) : false);

  const resolvedBg = bgRaw || (isDark ? "#09090b" : "#ffffff");
  const resolvedText = textRaw || (isDark ? "#f4f4f5" : "#0f172a");
  const resolvedCardBg = isDark ? "#18181b" : "#ffffff";
  const resolvedBorder = isDark ? "#27272a" : "#e2e8f0";
  const resolvedMuted = isDark ? "#27272a" : "#f1f5f9";
  const resolvedMutedForeground = isDark ? "#a1a1aa" : "#64748b";

  const customStyle = {
    "--primary": primaryColor,
    "--page-primary": primaryColor,
    colorScheme: isDark ? "dark" : "light",
    backgroundColor: resolvedBg,
    color: resolvedText,
    "--background": resolvedBg,
    "--foreground": resolvedText,
    "--card": resolvedCardBg,
    "--card-foreground": resolvedText,
    "--border": resolvedBorder,
    "--muted": resolvedMuted,
    "--muted-foreground": resolvedMutedForeground,
  } as CSSProperties;

  const contentConfig = (page.contentConfig ?? {}) as Record<string, unknown>;
  const profileConfig = (contentConfig.profile ?? {}) as Record<string, unknown>;
  const coverUrl =
    page.coverUrl ||
    (contentConfig.coverUrl as string) ||
    (contentConfig.cover_url as string) ||
    (profileConfig.coverUrl as string) ||
    (profileConfig.cover_url as string);
  const avatarUrl =
    page.avatarUrl ||
    (contentConfig.avatarUrl as string) ||
    (contentConfig.avatar_url as string) ||
    (profileConfig.avatarUrl as string) ||
    (profileConfig.avatar_url as string);

  return (
    <main
      style={customStyle}
      className={cn(
        "bg-background text-foreground min-h-svh pb-20 transition-colors duration-200",
        isDark ? "dark" : "light",
      )}
    >
      {/* 1. Header ảnh bìa */}
      {coverUrl ? (
        <div className="relative h-44 w-full overflow-hidden sm:h-60">
          <Image
            src={coverUrl}
            alt={page.title}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover"
          />
          <div className="from-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      ) : null}

      {/* 2. Header thông tin shop / thương hiệu */}
      <header className="mx-auto max-w-5xl px-4 pt-6 pb-4 text-center">
        {avatarUrl ? (
          <div
            className={cn(
              "ring-background bg-card relative mx-auto size-20 shrink-0 overflow-hidden rounded-full shadow-xl ring-4 sm:size-24",
              coverUrl && "-mt-16 sm:-mt-20",
            )}
          >
            <Image
              src={avatarUrl}
              alt={page.title}
              fill
              sizes="96px"
              unoptimized
              className="object-cover"
            />
          </div>
        ) : null}
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{page.title}</h1>
        {page.description ? (
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-xs sm:text-sm">
            {page.description}
          </p>
        ) : null}
      </header>

      {/* 3. Thanh điều khiển: Tìm kiếm & Lọc danh mục */}
      <div className="border-border/80 bg-background/90 sticky top-0 z-20 border-y shadow-2xs backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-2.5 sm:py-3">
          {showSearch ? (
            <div className="relative mb-2.5 sm:mb-3">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/50 focus-visible:bg-background border-border/80 focus-visible:border-primary/50 h-9 w-full rounded-full pr-10 pl-10 text-xs shadow-2xs transition-all sm:h-10 sm:text-sm"
              />
              {searchQuery ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 size-6 -translate-y-1/2 rounded-full"
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ) : null}

          {displayCategories.length > 0 ? (
            <div className="-mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0">
              <Button
                type="button"
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold shadow-2xs transition-all"
              >
                {t("allCategories", { count: filteredItems.length })}
              </Button>
              {displayCategories.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold shadow-2xs transition-all"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. Danh sách sản phẩm */}
      <section className="@container mx-auto max-w-5xl px-3 pt-6 sm:px-4">
        {filteredItems.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
            {t("emptyFiltered")}
          </div>
        ) : layout === "links" ? (
          /* Bố cục Minimal Links */
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const safeHref = toSafeHttpUrl(item.destinationUrl, { allowRelative: false });
              const safeImg = toSafeImageSrc(item.imageUrl);
              const content = (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-2 sm:pr-4">
                    {showImage && safeImg ? (
                      <div className="bg-muted/50 relative size-11 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={safeImg}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                        {item.title}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {showPrice && item.priceConfig?.amount
                          ? `${formatVndText(item.priceConfig.amount)} · `
                          : ""}
                        <span className="font-medium uppercase">{item.platform}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
                    <span>{item.buttonConfig?.label || t("viewNow")}</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </>
              );

              return safeHref ? (
                <Button
                  key={item.id}
                  asChild
                  variant="outline"
                  className={cn(
                    "hover:border-primary/50 group h-auto w-full items-center justify-between p-3 text-left font-normal whitespace-normal shadow-2xs transition-all hover:shadow-xs sm:p-3.5",
                    cardRadiusClass,
                  )}
                >
                  <Link href={safeHref as never} target="_blank" rel="noopener noreferrer nofollow">
                    {content}
                  </Link>
                </Button>
              ) : (
                <Button
                  key={item.id}
                  type="button"
                  disabled
                  variant="outline"
                  className={cn(
                    "group h-auto w-full items-center justify-between p-3 text-left font-normal whitespace-normal shadow-2xs sm:p-3.5",
                    cardRadiusClass,
                  )}
                >
                  {content}
                </Button>
              );
            })}
          </div>
        ) : layout === "list" ? (
          /* Bố cục Product List (Hàng ngang) */
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {filteredItems.map((item) => {
              const hasDiscount = Boolean(
                item.priceConfig?.originalAmount &&
                item.priceConfig.amount &&
                item.priceConfig.originalAmount > item.priceConfig.amount,
              );
              const discountPercent = hasDiscount
                ? Math.round(
                    (1 - item.priceConfig!.amount! / item.priceConfig!.originalAmount!) * 100,
                  )
                : 0;

              const safeHref = toSafeHttpUrl(item.destinationUrl, { allowRelative: false });
              const safeImg = toSafeImageSrc(item.imageUrl);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border-border/80 bg-card group hover:border-primary/40 flex flex-col gap-3.5 border p-3.5 shadow-2xs transition-all hover:shadow-md sm:flex-row sm:gap-4 sm:p-4",
                    cardRadiusClass,
                  )}
                >
                  {showImage && safeImg ? (
                    <div className="bg-muted/40 relative aspect-square w-full shrink-0 overflow-hidden rounded-xl sm:w-36">
                      <Image
                        src={safeImg}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      {item.badge ? (
                        <span
                          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-xs"
                          style={{
                            backgroundColor: item.badge.bgColor || "#EF4444",
                            color: item.badge.textColor || "#FFFFFF",
                          }}
                        >
                          {item.badge.text}
                        </span>
                      ) : null}
                      {discountPercent > 0 ? (
                        <span className="absolute top-2 right-2 inline-flex items-center rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                          -{discountPercent}%
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                            PLATFORM_STYLES[item.platform] ?? PLATFORM_STYLES.custom,
                          )}
                        >
                          {item.platform}
                        </span>
                        {item.isFeatured ? (
                          <Badge
                            variant="outline"
                            className="text-primary gap-1 py-0 text-[11px] font-medium"
                          >
                            <Sparkles className="size-3" />
                            {t("featured")}
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="text-foreground group-hover:text-primary mt-2 line-clamp-2 text-sm font-bold transition-colors sm:text-base">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5">
                      {showPrice ? (
                        <div>
                          {item.priceConfig?.mode === "fixed" && item.priceConfig.amount ? (
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="text-base font-extrabold tracking-tight text-rose-600 sm:text-lg dark:text-rose-400">
                                {formatVndText(item.priceConfig.amount)}
                              </span>
                              {item.priceConfig.originalAmount ? (
                                <span className="text-muted-foreground text-xs line-through">
                                  {formatVndText(item.priceConfig.originalAmount)}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs font-medium">
                              {item.priceConfig?.priceNote ||
                                t("buyNow", { platform: item.platform.toUpperCase() })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}
                      {safeHref ? (
                        <Button
                          size="sm"
                          asChild
                          className={cn("gap-1.5 px-3 font-semibold", buttonRadiusClass)}
                        >
                          <Link
                            href={safeHref as never}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                          >
                            <span>
                              {item.buttonConfig?.label ||
                                t("buyNow", { platform: item.platform.toUpperCase() })}
                            </span>
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Bố cục Product Grid (Mặc định chuẩn TMĐT) */
          <div
            className={cn(
              "grid gap-2.5 sm:gap-4",
              (responsiveConfig.mobileColumns ?? responsiveConfig.mobile_columns) === 1
                ? "grid-cols-1"
                : "grid-cols-2",
              "@min-[480px]:grid-cols-2 @min-[700px]:grid-cols-3 @min-[920px]:grid-cols-4",
            )}
          >
            {filteredItems.map((item) => {
              const hasDiscount = Boolean(
                item.priceConfig?.originalAmount &&
                item.priceConfig.amount &&
                item.priceConfig.originalAmount > item.priceConfig.amount,
              );
              const discountPercent = hasDiscount
                ? Math.round(
                    (1 - item.priceConfig!.amount! / item.priceConfig!.originalAmount!) * 100,
                  )
                : 0;

              const safeHref = toSafeHttpUrl(item.destinationUrl, { allowRelative: false });
              const safeImg = toSafeImageSrc(item.imageUrl);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border-border/80 bg-card group hover:border-primary/40 relative flex flex-col overflow-hidden border shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
                    cardRadiusClass,
                  )}
                >
                  {/* Khung ảnh sản phẩm */}
                  {showImage ? (
                    <div className="bg-muted/40 relative aspect-square w-full overflow-hidden">
                      {safeImg ? (
                        <Image
                          src={safeImg}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
                          {t("noImage")}
                        </div>
                      )}
                      {/* Badge tùy chỉnh (Hot deal, Khuyên dùng...) */}
                      {item.badge ? (
                        <span
                          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-tight shadow-xs"
                          style={{
                            backgroundColor: item.badge.bgColor || "#EF4444",
                            color: item.badge.textColor || "#FFFFFF",
                          }}
                        >
                          {item.badge.text}
                        </span>
                      ) : null}
                      {/* Badge giảm giá tự động nếu có */}
                      {discountPercent > 0 ? (
                        <span className="absolute top-2 right-2 inline-flex items-center rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                          -{discountPercent}%
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Nội dung thông tin thẻ */}
                  <div className="flex flex-1 flex-col p-2.5 sm:p-3">
                    <div className="mb-1 flex items-center gap-1">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase",
                          PLATFORM_STYLES[item.platform] ?? PLATFORM_STYLES.custom,
                        )}
                      >
                        {item.platform}
                      </span>
                      {item.isFeatured ? (
                        <span className="text-primary flex items-center gap-0.5 text-[10px] font-semibold">
                          <Sparkles className="size-2.5" />
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-foreground group-hover:text-primary line-clamp-2 min-h-[2rem] text-xs leading-snug font-semibold transition-colors sm:text-sm">
                      {item.title}
                    </h3>

                    {/* Khu vực giá tiền */}
                    {showPrice ? (
                      <div className="mt-auto pt-2">
                        {item.priceConfig?.mode === "fixed" && item.priceConfig.amount ? (
                          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                            <span className="text-xs font-extrabold tracking-tight text-rose-600 sm:text-sm dark:text-rose-400">
                              {formatVndText(item.priceConfig.amount)}
                            </span>
                            {item.priceConfig.originalAmount ? (
                              <span className="text-muted-foreground text-[10px] line-through">
                                {formatVndText(item.priceConfig.originalAmount)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-[10px] font-medium sm:text-[11px]">
                            {item.priceConfig?.priceNote ||
                              t("buyNow", { platform: item.platform.toUpperCase() })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-auto pt-1.5" />
                    )}

                    {/* Nút bấm CTA chuẩn E-commerce */}
                    {safeHref ? (
                      <Button
                        size="sm"
                        asChild
                        className={cn(
                          "group/btn mt-2 h-auto min-h-8 w-full gap-1 px-2 py-1.5 text-center text-[11px] leading-tight font-semibold whitespace-normal shadow-2xs sm:text-xs",
                          buttonRadiusClass,
                        )}
                      >
                        <Link
                          href={safeHref as never}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                        >
                          <span className="line-clamp-1">
                            {item.buttonConfig?.label ||
                              t("buyNow", { platform: item.platform.toUpperCase() })}
                          </span>
                          <ArrowUpRight className="size-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
