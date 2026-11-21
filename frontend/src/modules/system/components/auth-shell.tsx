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
 * Khung giao diện chuẩn cho các màn hình xác thực (Đăng nhập, Quên mật khẩu, Đặt lại mật khẩu, Callback OAuth):
 * - Vừa vặn hoàn hảo trong 1 màn hình duy nhất (No scroll trên desktop/tablet).
 * - Nền ambient mesh gradient với các đốm cực quang mờ ảo và lưới điểm tinh tế.
 * - Header thanh thoát: nút "Về trang chủ" góc trái và bộ đôi Language + Theme switcher góc phải.
 * - Trung tâm cân đối: Logo ToanNX cùng Card kính mờ (frosted glass) sắc nét ở cả Light & Dark mode.
 * - Chân trang bản quyền tinh giản.
 *
 * @param props - Cấu hình tiêu đề, mô tả, liên kết trang chủ và form nội dung.
 * @returns Khung trang xác thực.
 */
export function AuthShell({ homeHref, title, description, children }: AuthShellProps) {
  const tNav = useTranslations("common.nav");

  return (
    <main className="bg-background text-foreground selection:bg-primary/20 relative flex min-h-svh flex-col justify-between overflow-x-hidden overflow-y-auto sm:overflow-hidden">
      {/* 1. Lớp nền hiệu ứng Cực quang (Aurora Mesh) đa sắc màu & sống động */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Quầng sáng 1: Tím neon & Hồng Magenta (Góc trên bên trái) */}
        <div className="from-primary/25 via-ring/20 to-primary/5 dark:from-primary/20 dark:via-ring/15 absolute -top-32 -left-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-gradient-to-br blur-[100px] dark:to-transparent" />

        {/* Quầng sáng 2: Xanh ngọc Cyan & Sky & Indigo (Góc trên bên phải) */}
        <div className="from-ring/25 via-primary/15 to-primary/5 dark:from-ring/20 dark:via-primary/15 absolute -top-28 -right-28 h-[550px] w-[550px] animate-[pulse_10s_ease-in-out_infinite_1s] rounded-full bg-gradient-to-bl blur-[100px] dark:to-transparent" />

        {/* Quầng sáng 3: Hào quang Cực quang đa sắc ngay sau trung tâm Card */}
        <div className="from-primary/20 via-ring/20 to-primary/10 dark:from-primary/15 dark:via-ring/15 dark:to-primary/10 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_12s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-tr blur-[110px]" />

        {/* Quầng sáng 4: Hoàng hôn Cam Đào & Hổ Phách & Hồng Coral (Góc dưới bên trái) */}
        <div className="from-primary/15 via-ring/10 dark:from-primary/15 dark:via-ring/10 absolute -bottom-32 -left-20 h-[450px] w-[450px] rounded-full bg-gradient-to-tr to-transparent blur-[100px] dark:to-transparent" />

        {/* Quầng sáng 5: Xanh Ngọc Lục Bảo & Xanh Biển Sâu (Góc dưới bên phải) */}
        <div className="from-ring/20 via-primary/15 to-primary/5 dark:from-ring/15 dark:via-primary/10 absolute -right-24 -bottom-24 h-[450px] w-[450px] rounded-full bg-gradient-to-tl blur-[100px] dark:to-transparent" />

        {/* Lớp lưới không gian hiện đại (Cyber Cosmic Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_50%,#000_50%,transparent_100%)] bg-[size:48px_48px] opacity-70 dark:bg-[linear-gradient(to_right,rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.1)_1px,transparent_1px)] dark:opacity-40" />

        {/* Lưới điểm phát sáng rải rác tạo chiều sâu */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_40%,transparent_100%)] bg-[size:24px_24px] opacity-40 dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.3)_1px,transparent_1px)] dark:opacity-25" />

        {/* Điểm nhấn ánh sáng lấp lánh */}
        <div className="bg-ring/80 absolute top-1/4 left-1/5 size-2 animate-pulse rounded-full shadow-[0_0_12px_var(--ring)] blur-[1px]" />
        <div
          className="bg-primary/80 absolute top-1/3 right-1/4 size-1.5 animate-pulse rounded-full shadow-[0_0_10px_var(--primary)] blur-[1px]"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="bg-ring/80 absolute bottom-1/4 left-1/3 size-2 animate-pulse rounded-full shadow-[0_0_12px_var(--ring)] blur-[1px]"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* 2. Thanh header điều hướng: nút về trang chủ + switcher */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between p-4 sm:px-6 sm:py-5">
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

      {/* 3. Nội dung trung tâm: Căn giữa hoàn hảo, tinh tế */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-2 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo ToanNX thanh lịch trên đầu form */}
          <div className="mb-4 flex flex-col items-center">
            <Link
              href={homeHref as never}
              className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              aria-label="ToanNX"
            >
              <div className="bg-background/70 rounded-2xl border border-white/50 p-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
                <LogoMark className="size-8" title="ToanNX" />
              </div>
              <span className="text-foreground text-xs font-black tracking-[0.25em] uppercase">
                ToanNX
              </span>
            </Link>
          </div>

          {/* Card Form xác thực kính mờ */}
          <div className="relative">
            <div
              className="from-primary via-ring to-primary absolute -inset-1 rounded-[28px] bg-gradient-to-r opacity-20 blur-xl transition-all duration-700 dark:opacity-30"
              aria-hidden="true"
            />
            <Card className="bg-card/85 dark:bg-card/75 relative rounded-3xl border border-white/50 shadow-2xl backdrop-blur-2xl dark:border-white/10">
              <CardHeader className="space-y-1 pb-3 text-center">
                <CardTitle className="text-foreground text-xl font-bold tracking-tight">
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
      <footer className="text-muted-foreground/60 relative z-10 py-3 text-center text-xs">
        © {new Date().getFullYear()} ToanNX · toannx.com
      </footer>
    </main>
  );
}
