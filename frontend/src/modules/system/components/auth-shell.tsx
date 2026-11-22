"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { LogoMark } from "@/shares/components/layout/logo-mark";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { Button } from "@/shares/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";

interface AuthShellProps {
  homeHref: AppPathname;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Khung giao diện chuẩn cho các màn hình xác thực (Đăng nhập, Quên mật khẩu, Đặt lại mật khẩu):
 * - Vừa vặn hoàn hảo trong 1 màn hình duy nhất (No scroll trên desktop).
 * - Nền ambient thanh lịch, ánh sáng lan tỏa mềm mại và lớp họa tiết vi mô hiện đại.
 * - Header thanh thoát: nút "Về trang chủ" bên trái và cụm chọn ngôn ngữ + đổi giao diện bên phải.
 * - Trung tâm cân đối: Logo ToanNX sắc nét cùng Card bo góc tiêu chuẩn (rounded-2xl).
 * - Chân trang bản quyền tinh giản.
 *
 * @param props - Cấu hình tiêu đề, mô tả, liên kết trang chủ và form nội dung.
 * @returns Khung trang xác thực chuẩn UX.
 */
export function AuthShell({ homeHref, title, description, children }: AuthShellProps) {
  const tNav = useTranslations("common.nav");

  return (
    <main className="bg-background text-foreground selection:bg-primary/20 relative flex min-h-svh flex-col justify-between overflow-x-hidden overflow-y-auto sm:overflow-hidden">
      {/* 1. Lớp nền hiệu ứng ambient tinh tế & chiều sâu đa tầng */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Vầng hào quang ánh sáng trung tâm dịu nhẹ */}
        <div className="bg-primary/10 dark:bg-primary/15 absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]" />

        {/* Ánh sáng điểm xuyết góc trên và góc dưới */}
        <div className="bg-primary/5 dark:bg-primary/10 absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-[120px]" />
        <div className="bg-primary/5 dark:bg-primary/10 absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full blur-[120px]" />

        {/* Lớp họa tiết chấm mịn (Dot Grid) hiện đại với mask mờ dần ra mép */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_60%,transparent_100%)] [background-size:20px_20px] opacity-80 dark:opacity-45" />
      </div>

      {/* 2. Thanh header điều hướng: nút về trang chủ + switcher */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between p-4 sm:px-6 sm:py-5">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/60 h-9 gap-2 rounded-xl text-xs font-medium transition-colors"
        >
          <Link href={homeHref as never}>
            <ArrowLeft className="size-4" />
            <span>{tNav("backToHome")}</span>
          </Link>
        </Button>

        <div className="border-border/60 bg-card/60 flex items-center gap-1 rounded-xl border p-1 shadow-2xs backdrop-blur-md transition-all [&_button]:rounded-lg">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* 3. Nội dung trung tâm: Căn giữa hoàn hảo, tinh tế */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6">
        <div className="w-full max-w-[420px]">
          {/* Logo ToanNX thanh lịch trên đầu form */}
          <div className="mb-4 flex flex-col items-center">
            <Link
              href={homeHref as never}
              className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              aria-label="ToanNX"
            >
              <div className="border-border/60 bg-card group-hover:border-primary/50 relative flex size-12 items-center justify-center rounded-2xl border p-2 shadow-xs backdrop-blur-md transition-colors">
                <LogoMark className="size-7" title="ToanNX" />
              </div>
              <span className="text-foreground text-xs font-bold tracking-[0.2em] uppercase">
                ToanNX
              </span>
            </Link>
          </div>

          {/* Card Form xác thực chuẩn quy chuẩn F1 & F11 */}
          <Card className="border-border/80 bg-card/95 dark:border-border/60 dark:bg-card/90 rounded-2xl shadow-xl backdrop-blur-xl">
            <CardHeader className="space-y-1.5 px-6 pt-6 pb-2 text-center sm:px-8 sm:pt-7">
              <CardTitle className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </CardTitle>
              {description ? (
                <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                  {description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="px-6 pt-3 pb-6 sm:px-8 sm:pb-8">{children}</CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Footer bản quyền nhẹ nhàng */}
      <footer className="text-muted-foreground/60 relative z-10 py-4 text-center text-xs tracking-wide">
        © {new Date().getFullYear()} ToanNX · toannx.com
      </footer>
    </main>
  );
}
