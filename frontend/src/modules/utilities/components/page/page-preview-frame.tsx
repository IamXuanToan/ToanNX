"use client";

import { ExternalLink, Laptop, Maximize2, Smartphone, Tablet, X } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shares/components/ui/dialog";

import type { PublicPage as PublicPageType } from "../../types/page.types";
import { PublicPage } from "./public-page";

/**
 * Khung xem trước trực tiếp trang với bộ chuyển đổi thiết bị (Desktop / Tablet / Mobile).
 * Tối ưu tỷ lệ scale cho Desktop để layout không bị bẹp dúm trong không gian chia đôi màn hình.
 *
 * @param props - Dữ liệu trang công khai xem trước, thiết bị hiện tại và hàm chuyển đổi thiết bị.
 * @returns Khung xem trước responsive.
 */
export function PagePreviewFrame({
  page,
  device,
  onDeviceChange,
}: {
  page: PublicPageType;
  device: "desktop" | "tablet" | "mobile";
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const tCommon = useTranslations("common.actions");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [fullModalOpen, setFullModalOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Tính tỷ lệ scale cho khung Desktop và Tablet để hiển thị layout chuẩn
  const desktopWidth = 1000;
  const desktopScale = Math.min(1, Math.max(0.4, (containerWidth - 24) / desktopWidth));

  const tabletWidth = 680;
  const tabletScale = Math.min(1, Math.max(0.5, (containerWidth - 24) / tabletWidth));

  const rawTheme = (page.theme ?? {}) as Record<string, unknown>;
  const styleConfig = (page.styleConfig ?? {}) as Record<string, unknown>;
  const themeMode = (rawTheme.mode as string) ?? "system";
  const bgRaw =
    (rawTheme.backgroundColor as string) ??
    (rawTheme.background_color as string) ??
    (styleConfig?.backgroundColor as string) ??
    (styleConfig?.background_color as string);

  const isLightHex = (hex?: string) => {
    if (!hex || !hex.startsWith("#") || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  };

  const isDark =
    themeMode === "dark" || (themeMode !== "light" && bgRaw ? !isLightHex(bgRaw) : false);

  return (
    <>
      <div
        ref={containerRef}
        className="border-border bg-muted/30 flex flex-col rounded-2xl border p-3.5 shadow-2xs"
      >
        {/* Thanh điều khiển Canvas */}
        <div className="border-border/60 mb-3 flex items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-xs font-semibold">{t("tabs.preview")}</span>
            <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium">
              {device === "mobile"
                ? "375px"
                : device === "tablet"
                  ? `${Math.round(tabletWidth * tabletScale)}px`
                  : `${Math.round(desktopWidth * desktopScale)}px`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Switcher thiết bị */}
            <div className="border-border bg-background flex items-center rounded-lg border p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant={device === "mobile" ? "secondary" : "ghost"}
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onDeviceChange("mobile")}
                aria-label={t("previewDevices.mobile")}
              >
                <Smartphone className="size-3.5" />
                <span className="hidden text-[11px] sm:inline">{t("previewDevices.mobile")}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "tablet" ? "secondary" : "ghost"}
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onDeviceChange("tablet")}
                aria-label={t("previewDevices.tablet")}
              >
                <Tablet className="size-3.5" />
                <span className="hidden text-[11px] sm:inline">{t("previewDevices.tablet")}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={device === "desktop" ? "secondary" : "ghost"}
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onDeviceChange("desktop")}
                aria-label={t("previewDevices.desktop")}
              >
                <Laptop className="size-3.5" />
                <span className="hidden text-[11px] sm:inline">{t("previewDevices.desktop")}</span>
              </Button>
            </div>

            {/* Mở xem phóng to toàn màn hình */}
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              onClick={() => setFullModalOpen(true)}
              className="size-7 rounded-lg"
              title={t("maximizePreview")}
            >
              <Maximize2 className="size-3.5" />
            </Button>

            {/* Nút mở tab mới xem trang thật nếu đã lưu */}
            {page.canonicalUrl ? (
              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                asChild
                className="size-7 rounded-lg"
                title={t("view")}
              >
                <NextLink href={page.canonicalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                </NextLink>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Vùng Canvas hiển thị Mockup */}
        <div className="flex w-full items-center justify-center overflow-x-hidden py-2">
          {device === "mobile" ? (
            /* Mockup Điện thoại iPhone */
            <div
              className={cn(
                "bg-background @container relative mx-auto flex w-[375px] max-w-full flex-col overflow-hidden rounded-[2.5rem] border-[8px] border-neutral-900 shadow-2xl transition-all duration-300 dark:border-neutral-800",
                isDark ? "dark" : "light",
              )}
            >
              <div className="pointer-events-none absolute top-2 left-1/2 z-20 h-3.5 w-24 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-800" />
              <div className={cn("h-[640px] overflow-y-auto", page.coverUrl ? "pt-0" : "pt-6")}>
                <PublicPage page={page} />
              </div>
              <div className="bg-background/80 relative flex h-3.5 w-full items-center justify-center backdrop-blur-xs">
                <div className="bg-foreground/20 h-1 w-24 rounded-full" />
              </div>
            </div>
          ) : device === "tablet" ? (
            /* Mockup Tablet iPad với tỷ lệ co dãn */
            <div className="flex w-full flex-col items-center overflow-hidden">
              <div
                className={cn(
                  "bg-background @container relative overflow-hidden rounded-2xl border-[8px] border-neutral-900 shadow-xl dark:border-neutral-800",
                  isDark ? "dark" : "light",
                )}
                style={{
                  width: tabletWidth,
                  transform: `scale(${tabletScale})`,
                  transformOrigin: "top center",
                  height: 640 / tabletScale,
                }}
              >
                <div className="h-full overflow-y-auto">
                  <PublicPage page={page} />
                </div>
              </div>
            </div>
          ) : (
            /* Mockup Desktop Browser với tỷ lệ co dãn mượt mà */
            <div className="flex w-full flex-col items-center overflow-hidden">
              <div
                className={cn(
                  "border-border bg-background @container relative flex flex-col overflow-hidden rounded-xl border shadow-md",
                  isDark ? "dark" : "light",
                )}
                style={{
                  width: desktopWidth,
                  transform: `scale(${desktopScale})`,
                  transformOrigin: "top center",
                  height: 660 / desktopScale,
                }}
              >
                {/* Thanh tiêu đề cửa sổ browser */}
                <div className="border-border bg-muted/60 flex shrink-0 items-center gap-1.5 border-b px-4 py-2">
                  <div className="size-2.5 rounded-full bg-red-400/80" />
                  <div className="size-2.5 rounded-full bg-amber-400/80" />
                  <div className="size-2.5 rounded-full bg-emerald-400/80" />
                  <div className="bg-background/80 text-muted-foreground mx-auto max-w-sm truncate rounded-md px-3 py-0.5 text-center font-mono text-xs">
                    {page.canonicalUrl
                      ? page.canonicalUrl.replace(/^https?:\/\//, "")
                      : `toannx.com/p/${page.slug}`}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <PublicPage page={page} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal xem trước toàn màn hình */}
      <Dialog open={fullModalOpen} onOpenChange={setFullModalOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "flex h-[92vh] max-h-[960px] w-[95vw] flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-7xl",
            isDark && "dark",
          )}
        >
          {/* Header điều khiển trong Modal xem trước */}
          <div className="bg-muted/40 border-border/80 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <DialogTitle className="truncate text-sm font-semibold">
                {t("livePreviewTitle", { title: page.title })}
              </DialogTitle>
              <span className="bg-muted text-muted-foreground hidden rounded-md px-2 py-0.5 font-mono text-[11px] font-medium sm:inline">
                {device === "mobile"
                  ? "Mobile (375px)"
                  : device === "tablet"
                    ? "Tablet (768px)"
                    : "Desktop (100%)"}
              </span>
            </div>

            {/* Bộ chuyển đổi thiết bị ngay trong Modal */}
            <div className="flex items-center gap-2">
              <div className="border-border bg-background flex items-center rounded-lg border p-0.5 shadow-2xs">
                <Button
                  type="button"
                  size="sm"
                  variant={device === "mobile" ? "secondary" : "ghost"}
                  className="h-7 gap-1 px-2.5 text-xs font-medium"
                  onClick={() => onDeviceChange("mobile")}
                  aria-label={t("previewDevices.mobile")}
                >
                  <Smartphone className="size-3.5" />
                  <span className="hidden text-[11px] sm:inline">{t("previewDevices.mobile")}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={device === "tablet" ? "secondary" : "ghost"}
                  className="h-7 gap-1 px-2.5 text-xs font-medium"
                  onClick={() => onDeviceChange("tablet")}
                  aria-label={t("previewDevices.tablet")}
                >
                  <Tablet className="size-3.5" />
                  <span className="hidden text-[11px] sm:inline">{t("previewDevices.tablet")}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={device === "desktop" ? "secondary" : "ghost"}
                  className="h-7 gap-1 px-2.5 text-xs font-medium"
                  onClick={() => onDeviceChange("desktop")}
                  aria-label={t("previewDevices.desktop")}
                >
                  <Laptop className="size-3.5" />
                  <span className="hidden text-[11px] sm:inline">
                    {t("previewDevices.desktop")}
                  </span>
                </Button>
              </div>

              {page.canonicalUrl ? (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  asChild
                  className="size-7 rounded-lg"
                  title={t("view")}
                >
                  <NextLink href={page.canonicalUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                  </NextLink>
                </Button>
              ) : null}

              {/* Nút đóng modal thẳng hàng chuẩn chỉnh */}
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setFullModalOpen(false)}
                className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                title={tCommon("close")}
              >
                <X className="size-4" />
                <span className="sr-only">{tCommon("close")}</span>
              </Button>
            </div>
          </div>

          {/* Vùng xem trước responsive mô phỏng thiết bị tương ứng */}
          <div className="bg-muted/30 flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto p-4 sm:p-6">
            {device === "mobile" ? (
              /* Khung Điện thoại Smartphone trong Modal */
              <div
                className={cn(
                  "bg-background relative mx-auto my-auto flex w-[375px] max-w-full shrink-0 flex-col overflow-hidden rounded-[2.5rem] border-[8px] border-neutral-900 shadow-2xl transition-all duration-300 dark:border-neutral-800",
                  isDark ? "dark" : "light",
                )}
              >
                <div className="pointer-events-none absolute top-2 left-1/2 z-20 h-3.5 w-24 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-800" />
                <div
                  className={cn(
                    "h-[680px] max-h-[72vh] overflow-y-auto",
                    page.coverUrl ? "pt-0" : "pt-6",
                  )}
                >
                  <PublicPage page={page} />
                </div>
                <div className="bg-background/80 relative flex h-3.5 w-full shrink-0 items-center justify-center backdrop-blur-xs">
                  <div className="bg-foreground/20 h-1 w-24 rounded-full" />
                </div>
              </div>
            ) : device === "tablet" ? (
              /* Khung Máy tính bảng Tablet iPad trong Modal */
              <div
                className={cn(
                  "bg-background relative mx-auto my-auto flex h-[740px] max-h-[76vh] w-[768px] max-w-full shrink-0 flex-col overflow-hidden rounded-2xl border-[8px] border-neutral-900 shadow-xl transition-all duration-300 dark:border-neutral-800",
                  isDark ? "dark" : "light",
                )}
              >
                <div className="flex-1 overflow-y-auto">
                  <PublicPage page={page} />
                </div>
              </div>
            ) : (
              /* Khung Máy tính Desktop Browser trong Modal */
              <div
                className={cn(
                  "border-border bg-background relative my-auto flex h-[780px] max-h-[80vh] w-full max-w-6xl shrink-0 flex-col overflow-hidden rounded-xl border shadow-2xl transition-all duration-300",
                  isDark ? "dark" : "light",
                )}
              >
                {/* Thanh cửa sổ trình duyệt máy tính */}
                <div className="border-border bg-muted/70 flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-red-400/90" />
                    <div className="size-2.5 rounded-full bg-amber-400/90" />
                    <div className="size-2.5 rounded-full bg-emerald-400/90" />
                  </div>
                  <div className="bg-background text-muted-foreground mx-auto flex max-w-md items-center justify-center gap-1.5 truncate rounded-lg border px-4 py-0.5 font-mono text-xs shadow-2xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      https://
                    </span>
                    <span className="truncate">
                      {page.canonicalUrl
                        ? page.canonicalUrl.replace(/^https?:\/\//, "")
                        : `toannx.com/p/${page.slug}`}
                    </span>
                  </div>
                </div>
                {/* Vùng hiển thị toàn bộ trang trên Desktop */}
                <div className="flex-1 overflow-y-auto">
                  <PublicPage page={page} />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
