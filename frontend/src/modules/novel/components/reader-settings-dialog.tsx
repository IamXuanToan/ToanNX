/**
 * Dialog cấu hình giao diện đọc truyện (cỡ chữ, giãn dòng, font, theme, khung đọc).
 */

"use client";

import { Check, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";
import { Label } from "@/shares/components/ui/label";
import { Slider } from "@/shares/components/ui/slider";

import type { ReaderSettings } from "../types/reader-settings.types";

// ============================================================================
// TYPES & OPTIONS
// ============================================================================

export type ReaderSettingsDialogProps = {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
};

const THEME_OPTIONS: Array<{
  id: ReaderSettings["theme"];
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = [
  { id: "light", bgClass: "bg-white", textClass: "text-zinc-900", borderClass: "border-zinc-300" },
  {
    id: "sepia",
    bgClass: "bg-[#fbf0d9]",
    textClass: "text-[#5f4b32]",
    borderClass: "border-[#d8c4a6]",
  },
  {
    id: "gray",
    bgClass: "bg-[#25282a]",
    textClass: "text-[#d1d5db]",
    borderClass: "border-[#3f4347]",
  },
  { id: "oled", bgClass: "bg-black", textClass: "text-[#9ca3af]", borderClass: "border-zinc-800" },
];

const FONT_OPTIONS: Array<{ id: ReaderSettings["fontFamily"]; label: string; fontClass: string }> =
  [
    { id: "serif", label: "Serif (Merriweather)", fontClass: "font-serif" },
    { id: "sans", label: "Sans-Serif (Inter)", fontClass: "font-sans" },
    { id: "mono", label: "Monospace", fontClass: "font-mono" },
  ];

const WIDTH_OPTIONS: Array<{
  id: ReaderSettings["contentWidth"];
  labelKey: "widthNarrow" | "widthNormal" | "widthWide";
}> = [
  { id: "narrow", labelKey: "widthNarrow" },
  { id: "normal", labelKey: "widthNormal" },
  { id: "wide", labelKey: "widthWide" },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Hộp thoại cấu hình tùy biến hiển thị của trình đọc truyện.
 *
 * @param props - Thuộc tính `ReaderSettingsDialogProps`.
 * @returns Hộp thoại cài đặt giao diện đọc.
 */
export function ReaderSettingsDialog({ settings, onUpdate }: ReaderSettingsDialogProps) {
  const t = useTranslations("novel.reader");

  const themeLabelMap: Record<ReaderSettings["theme"], string> = {
    light: t("lightTheme"),
    sepia: t("sepiaTheme"),
    gray: t("grayTheme"),
    oled: t("oledTheme"),
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("settings")}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Theme màu nền */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">{t("themeLabel")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = settings.theme === opt.id;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="outline"
                    onClick={() => onUpdate({ theme: opt.id })}
                    className={`flex h-auto flex-col items-center justify-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all ${opt.bgClass} ${opt.textClass} ${opt.borderClass} ${
                      isActive ? "ring-primary ring-2 ring-offset-2" : "hover:opacity-90"
                    }`}
                  >
                    <span>{themeLabelMap[opt.id]}</span>
                    {isActive && <Check className="h-3 w-3" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Phông chữ */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">
              {t("fontFamilyLabel")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isActive = settings.fontFamily === f.id;
                return (
                  <Button
                    key={f.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ fontFamily: f.id })}
                    className={f.fontClass}
                  >
                    {f.label.split(" ")[0]}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Cỡ chữ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="text-muted-foreground font-medium">{t("fontSizeLabel")}</Label>
              <span className="text-muted-foreground font-mono">{settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              min={14}
              max={32}
              step={1}
              onValueChange={([val]) => val && onUpdate({ fontSize: val })}
            />
          </div>

          {/* Giãn dòng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="text-muted-foreground font-medium">{t("lineHeightLabel")}</Label>
              <span className="text-muted-foreground font-mono">
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.lineHeight * 10]}
              min={14}
              max={26}
              step={1}
              onValueChange={([val]) => val && onUpdate({ lineHeight: val / 10 })}
            />
          </div>

          {/* Độ rộng khung đọc */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">
              {t("contentWidthLabel")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {WIDTH_OPTIONS.map((w) => {
                const isActive = settings.contentWidth === w.id;
                return (
                  <Button
                    key={w.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ contentWidth: w.id })}
                  >
                    {t(w.labelKey)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
