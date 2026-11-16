"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

const THEME_CYCLE: Record<string, "light" | "dark" | "system"> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const emptySubscribe = () => () => {};

/**
 * Nút chuyển nhanh giao diện theo vòng lặp 3 chế độ: Sáng -> Tối -> Theo hệ thống.
 * Không dùng dropdown, bấm trực tiếp để đổi giao diện tức thì.
 *
 * @returns Nút bấm đổi theme.
 */
export function ThemeSwitcher() {
  const t = useTranslations("common.theme");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handleCycle = () => {
    const nextTheme = THEME_CYCLE[theme ?? "system"] ?? "light";
    setTheme(nextTheme);
  };

  const currentTheme = mounted ? (theme ?? "system") : "light";
  const label =
    mounted && theme ? `${t("toggle")}: ${t(theme as "light" | "dark" | "system")}` : t("toggle");

  const renderIcon = () => {
    if (!mounted) {
      return <Sun className="size-4" />;
    }
    if (currentTheme === "dark") {
      return <Moon className="size-4" />;
    }
    if (currentTheme === "system") {
      return <Monitor className="size-4" />;
    }
    return <Sun className="size-4" />;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCycle}
          aria-label={label}
          data-testid="theme-switcher"
        >
          {renderIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
