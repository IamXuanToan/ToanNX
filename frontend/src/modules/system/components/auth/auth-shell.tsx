"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { LogoMark } from "@/shares/components/layout/logo-mark";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { Button } from "@/shares/components/ui/button";
import { BRAND_PATHS } from "@/shares/lib/asset-paths";

interface AuthShellProps {
  homeHref: AppPathname;
  title: string;
  description?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  children: ReactNode;
}

/**
 * Khung giao diện Split-Screen hiện đại cho các màn hình xác thực (Đăng nhập, Quên mật khẩu, Đặt lại mật khẩu):
 * - Banner thương hiệu nền tối với đường cong vòm đặc trưng ở cạnh phải trên desktop và bo đáy trên mobile.
 * - Card xác thực 2 cột bo góc lớn (rounded-3xl / rounded-[36px]) với bóng đổ sâu và viền mỏng.
 * - Bộ chuyển đổi ngôn ngữ chuẩn của hệ thống (LanguageSwitcher) đồng bộ cùng ThemeSwitcher.
 * - Giữ vững tiêu chuẩn truy cập, tương thích hoàn hảo giữa Light Mode và Dark Mode.
 *
 * @param props - Cấu hình tiêu đề, banner thương hiệu, liên kết trang chủ và form nội dung.
 * @returns Khung trang xác thực chuẩn UX.
 */
export function AuthShell({
  homeHref,
  title,
  description,
  heroTitle,
  heroSubtitle,
  heroDescription,
  children,
}: AuthShellProps) {
  const tNav = useTranslations("common.nav");
  const tAuth = useTranslations("system.auth.login");

  const effectiveHeroTitle = heroTitle ?? tAuth("welcomeBack");
  const effectiveHeroSubtitle = heroSubtitle ?? tAuth("accountBrand");
  const effectiveHeroDescription = heroDescription ?? tAuth("accountDesc");

  return (
    <main className="text-foreground selection:bg-primary/20 dark:bg-background relative flex h-svh max-h-svh flex-col justify-between overflow-hidden bg-neutral-100/70 p-3 sm:px-6 sm:py-4">
      {/* 1. Lớp nền hiệu ứng ambient tinh tế & chiều sâu đa tầng */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Vầng hào quang ánh sáng trung tâm dịu nhẹ */}
        <div className="bg-primary/5 dark:bg-primary/10 absolute top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]" />

        {/* Lớp họa tiết chấm mịn (Dot Grid) hiện đại với mask mờ dần ra mép */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_60%,transparent_100%)] [background-size:20px_20px] opacity-70 dark:opacity-40" />
      </div>

      {/* 2. Thanh header điều hướng: nút về trang chủ + cụm switcher chuẩn */}
      <header className="relative z-10 mx-auto flex w-full max-w-4xl flex-none items-center justify-between pb-2 sm:pb-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 gap-2 rounded-xl text-xs font-medium transition-colors"
        >
          <Link href={homeHref as never}>
            <ArrowLeft className="size-4" />
            <span>{tNav("backToHome")}</span>
          </Link>
        </Button>

        {/* Cụm chọn ngôn ngữ chuẩn và đổi theme của hệ thống */}
        <div className="border-border/60 bg-card/80 flex items-center gap-1 rounded-xl border p-1 shadow-2xs backdrop-blur-md transition-all [&_button]:rounded-lg">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* 3. Khối Card xác thực chính: Split-Screen Card 2 cột */}
      <section className="relative z-10 mx-auto my-auto flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center py-1">
        <div className="border-border/80 bg-card relative flex w-full flex-col overflow-hidden rounded-[24px] border shadow-2xl transition-all sm:rounded-[32px] md:flex-row">
          {/* Cột trái (Banner thương hiệu với hình ảnh 3D Glassmorphism Clover & Gradient Emerald) */}
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-b-[28px] bg-emerald-950 p-5 text-white sm:rounded-b-[36px] sm:p-7 md:w-[44%] md:shrink-0 md:rounded-r-[60px] md:rounded-b-none lg:w-[42%] lg:rounded-r-[72px]">
            {/* Ảnh minh họa 3D Clover chất lượng cao phủ toàn bộ background */}
            <Image
              src={BRAND_PATHS.authBanner}
              alt="ToanNX Brand Visual"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 42vw"
              className="pointer-events-none object-cover object-center transition-transform duration-700"
            />

            {/* Lớp phủ gradient đa tầng tinh tế giúp text luôn đạt độ tương phản tối đa */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/50 to-emerald-950/80 md:bg-gradient-to-b md:from-emerald-950/75 md:via-emerald-950/40 md:to-emerald-950/95"
              aria-hidden="true"
            />

            {/* Vệt sáng xanh ngọc mềm mại bổ trợ */}
            <div
              className="bg-primary/25 pointer-events-none absolute -top-16 -left-16 size-48 rounded-full blur-3xl"
              aria-hidden="true"
            />

            {/* Phần trên banner: Logo & Tên hệ thống */}
            <div className="relative z-10 flex items-center gap-3">
              <Link
                href={homeHref as never}
                className="group flex items-center gap-2.5 transition-transform hover:opacity-95"
                aria-label="ToanNX"
              >
                <div className="border-primary/40 flex size-7 items-center justify-center rounded-lg border bg-emerald-950/70 p-1 shadow-md backdrop-blur-md">
                  <LogoMark className="size-4.5" title="ToanNX" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-white uppercase drop-shadow-sm sm:text-sm">
                  {effectiveHeroSubtitle}
                </span>
              </Link>
            </div>

            {/* Phần giữa/dưới banner: Lời chào và mô tả thương hiệu */}
            <div className="relative z-10 my-auto py-2.5 text-center sm:py-4 md:my-0 md:mt-auto md:text-left">
              <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-md sm:text-2xl lg:text-[26px]">
                {effectiveHeroTitle}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/90 drop-shadow-sm sm:text-xs">
                {effectiveHeroDescription}
              </p>
            </div>
          </div>

          {/* Cột phải: Form nội dung xác thực */}
          <div className="flex flex-1 flex-col justify-center px-6 py-5 sm:px-8 sm:py-6 lg:px-10">
            <div className="mb-3">
              <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
              ) : null}
            </div>

            {/* Nội dung form */}
            <div>{children}</div>
          </div>
        </div>
      </section>

      {/* 4. Footer bản quyền nhẹ nhàng */}
      <footer className="text-muted-foreground/60 relative z-10 flex-none py-1.5 text-center text-[11px] tracking-wide sm:text-xs">
        © {new Date().getFullYear()} ToanNX · toannx.com
      </footer>
    </main>
  );
}
