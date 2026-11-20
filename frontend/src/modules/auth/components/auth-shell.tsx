"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/shares/components/layout/language-switcher";
import { LogoMark } from "@/shares/components/layout/logo";
import { ThemeSwitcher } from "@/shares/components/layout/theme-switcher";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shares/components/ui/card";

interface AuthShellProps {
  homeHref: AppPathname;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Khung giao diện chuẩn cho các màn hình xác thực (Đăng nhập, Quên mật khẩu, Đặt lại mật khẩu):
 * - Nền ambient mesh gradient với các đốm cực quang mờ ảo và lưới điểm tinh tế.
 * - Header thanh thoát: nút "Về trang chủ" góc trái và bộ đôi Language + Theme switcher góc phải.
 * - Card trung tâm kính mờ (frosted glass) nổi bật, sắc nét ở cả Light & Dark mode.
 * - Chân trang bản quyền tinh giản.
 *
 * @param props - Cấu hình tiêu đề, mô tả, liên kết trang chủ và form nội dung.
 * @returns Khung trang xác thực.
 */
export function AuthShell({ homeHref, title, description, children }: AuthShellProps) {
  const tNav = useTranslations("common.nav");

  return (
    <main className="bg-background text-foreground selection:bg-primary/20 relative flex min-h-svh flex-col justify-between overflow-x-hidden">
      {/* 1. Lớp nền hiệu ứng Cực quang (Aurora Mesh) đa sắc màu & sống động */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Quầng sáng 1: Tím neon & Hồng Magenta (Góc trên bên trái) */}
        <div className="absolute -top-32 -left-32 h-[550px] w-[550px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-violet-600/35 via-fuchsia-500/25 to-pink-500/5 blur-[100px] dark:from-violet-600/40 dark:via-fuchsia-600/30 dark:to-transparent" />

        {/* Quầng sáng 2: Xanh ngọc Cyan & Sky & Điện tích Indigo (Góc trên bên phải) */}
        <div className="absolute -top-28 -right-28 h-[600px] w-[600px] animate-[pulse_10s_ease-in-out_infinite_1s] rounded-full bg-gradient-to-bl from-cyan-400/35 via-sky-500/25 to-indigo-600/10 blur-[100px] dark:from-cyan-400/30 dark:via-blue-600/30 dark:to-transparent" />

        {/* Quầng sáng 3: Hào quang Cực quang đa sắc ngay sau trung tâm Card */}
        <div className="absolute top-1/2 left-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_12s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/35 to-rose-400/25 blur-[110px] dark:from-indigo-600/35 dark:via-purple-700/35 dark:to-pink-600/25" />

        {/* Quầng sáng 4: Hoàng hôn Cam Đào & Hổ Phách & Hồng Coral (Góc dưới bên trái) */}
        <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-400/30 via-rose-500/25 to-transparent blur-[100px] dark:from-rose-600/30 dark:via-amber-600/20 dark:to-transparent" />

        {/* Quầng sáng 5: Xanh Ngọc Lục Bảo & Xanh Biển Sâu (Góc dưới bên phải) */}
        <div className="absolute -right-24 -bottom-24 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-emerald-400/30 via-teal-500/25 to-sky-600/10 blur-[100px] dark:from-emerald-500/30 dark:via-teal-700/25 dark:to-transparent" />

        {/* Lớp lưới không gian hiện đại (Cyber Cosmic Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_50%,#000_50%,transparent_100%)] bg-[size:48px_48px] opacity-70 dark:bg-[linear-gradient(to_right,rgba(168,85,247,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.12)_1px,transparent_1px)] dark:opacity-40" />

        {/* Lưới điểm phát sáng rải rác tạo chiều sâu */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.3)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_40%,transparent_100%)] bg-[size:24px_24px] opacity-50 dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.4)_1px,transparent_1px)] dark:opacity-30" />

        {/* Điểm nhấn ánh sáng lấp lánh (Sparkling glowing stars) */}
        <div className="absolute top-1/4 left-1/5 size-2 animate-pulse rounded-full bg-cyan-400/80 shadow-[0_0_12px_#38bdf8] blur-[1px]" />
        <div
          className="absolute top-1/3 right-1/4 size-1.5 animate-pulse rounded-full bg-fuchsia-400/80 shadow-[0_0_10px_#e879f9] blur-[1px]"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 size-2 animate-pulse rounded-full bg-amber-400/80 shadow-[0_0_12px_#fbbf24] blur-[1px]"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute right-1/5 bottom-1/3 size-1.5 animate-pulse rounded-full bg-emerald-400/80 shadow-[0_0_10px_#34d399] blur-[1px]"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* 2. Thanh header điều hướng: nút về trang chủ + switcher */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between p-4 sm:px-6 sm:py-5">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-border/40 bg-background/60 hover:bg-background/80 gap-2 rounded-full shadow-xs backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        >
          <Link href={homeHref as never}>
            <ArrowLeft className="size-4" />
            <span>{tNav("backToHome")}</span>
          </Link>
        </Button>

        <div className="border-border/40 bg-background/60 flex items-center gap-1 rounded-full border p-1 shadow-xs backdrop-blur-md transition-all [&_button]:rounded-full">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* 3. Nội dung trung tâm: Logo thương hiệu + Thẻ kính mờ */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <Link
            href={homeHref as never}
            className="group mx-auto flex w-fit flex-col items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
            aria-label="TOANNX"
          >
            <div className="relative">
              {/* Vầng sáng viền logo */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-sky-500 to-pink-500 opacity-30 blur-md transition-opacity group-hover:opacity-60" />
              <div className="bg-background/70 relative rounded-2xl border border-white/50 p-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
                <LogoMark className="size-10" title="TOANNX" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-xs font-black tracking-[0.25em] text-transparent uppercase transition-all dark:from-white dark:via-sky-200 dark:to-indigo-200">
              TOANNX
            </span>
          </Link>

          {/* Wrapper chứa viền hào quang đa sắc màu bao quanh Card */}
          <div className="relative">
            <div
              className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-violet-600 via-pink-500 via-sky-500 to-amber-400 opacity-25 blur-xl transition-all duration-700 dark:opacity-40"
              aria-hidden="true"
            />
            <Card className="bg-card/85 dark:bg-card/75 relative rounded-3xl border border-white/50 shadow-2xl backdrop-blur-2xl dark:border-white/10">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:via-slate-100 dark:to-indigo-100">
                  {title}
                </CardTitle>
                {description ? (
                  <CardDescription className="text-xs leading-relaxed">
                    {description}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Footer bản quyền nhẹ nhàng */}
      <footer className="text-muted-foreground/60 relative z-10 py-4 text-center text-xs">
        © {new Date().getFullYear()} TOANNX · toannx.com
      </footer>
    </main>
  );
}
