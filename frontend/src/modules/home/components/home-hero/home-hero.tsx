"use client";

import { ArrowRight, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { MANAGE_APP_ROUTES } from "@/modules/manage-app/constants/routes";
import { Button } from "@/shares/components/ui/button";

import { LIGHT_THEMES, MagicUniverse, type MagicUniverseHandle } from "../magic-universe/magic-universe";

/**
 * Giao diện trang chủ cá nhân theo phong cách Minimalist Art & Organic Liquid 3D:
 * - Nền đen obsidian sang trọng với khối điêu khắc 3D chất lỏng biến dạng thời gian thực.
 * - Ánh sáng Studio phản chiếu specular caustics mượt mà trên bề mặt bóng bẩy.
 * - Typography phong cách Editorial hiện đại, thoáng đạt, không rối rắm.
 * - Tương tác chuyển đổi 4 mood ánh sáng nghệ thuật.
 */
export function HomeHero() {
  const t = useTranslations("common.home");
  const [magicHandle, setMagicHandle] = useState<MagicUniverseHandle | null>(null);
  const [themeIndex, setThemeIndex] = useState(0);

  const handleCycleTheme = () => {
    const nextIdx = magicHandle?.cycleTheme();
    if (typeof nextIdx === "number") {
      setThemeIndex(nextIdx);
    }
  };

  const currentThemeName = t(`lightThemes.${themeIndex}` as Parameters<typeof t>[0]);

  return (
    <div className="dark relative flex min-h-svh w-full flex-col items-center justify-between overflow-hidden bg-[#06070b] bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(30,27,75,0.22)_0%,rgba(6,7,11,0.85)_60%,#06070b_100%)] px-4 pt-20 pb-8 text-slate-100 select-none">
      {/* 1. Điêu khắc chất lỏng 3D tương tác toàn màn hình */}
      <MagicUniverse onReady={setMagicHandle} onThemeChange={setThemeIndex} />

      {/* 2. Header phụ: Huy hiệu định danh cá nhân tinh tế */}
      <div className="relative z-10 flex flex-col items-center pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium tracking-wide text-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md transition-colors hover:border-white/20">
          <span
            className="size-2 rounded-full transition-colors duration-700"
            style={{ backgroundColor: LIGHT_THEMES[themeIndex].colorA }}
          />
          <span className="font-mono text-[11px] uppercase tracking-wider">{t("badge")}</span>
        </div>
      </div>

      {/* 3. Nội dung trung tâm: Typography đỉnh cao & Bố cục thoáng đạt */}
      <div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col items-center text-center">
        {/* Lời chào & Tên tác giả */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.3em] text-slate-400 uppercase drop-shadow sm:text-sm">
            {t("greeting")}
          </p>
          <h1 className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] sm:text-8xl lg:text-9xl">
            {t("name")}
          </h1>
        </div>

        {/* Chức danh & Giới thiệu ngắn gọn, lịch lãm */}
        <div className="mt-4 max-w-xl space-y-2">
          <p className="text-sm font-medium text-slate-200 sm:text-base">{t("role")}</p>
          <p className="text-xs font-normal text-slate-400/90 leading-relaxed sm:text-sm">{t("tagline")}</p>
        </div>

        {/* 2 Nút hành động tối giản, sang xịn */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="group rounded-full bg-white px-7 py-6 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(255,255,255,0.25)] transition-all hover:scale-105 hover:bg-slate-100 active:scale-95"
          >
            <Link href={MANAGE_APP_ROUTES.admin}>
              {t("ctaAdmin")}
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handleCycleTheme}
            className="group rounded-full border border-white/15 bg-white/[0.06] px-6 py-6 text-sm font-medium text-slate-200 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.12] active:scale-95"
          >
            <Palette className="mr-2 size-4 text-slate-300 transition-transform group-hover:rotate-45" />
            <span>
              {t("ctaTheme")}: <strong className="font-semibold text-white">{currentThemeName}</strong>
            </span>
          </Button>
        </div>
      </div>

      {/* 4. Footer chân trang: Tinh giản, sạch sẽ */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs text-slate-400/80 sm:flex-row sm:text-left">
        <div>{t("footer.copyright")}</div>
        <div className="font-mono text-[11px] text-slate-400/70">{t("footer.tech")}</div>
      </div>
    </div>
  );
}
