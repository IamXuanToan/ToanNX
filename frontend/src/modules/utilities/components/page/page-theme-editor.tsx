"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import { cn } from "cn";

import { ColorInput } from "@/shares/components/common/color-input";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";

import type { PageFormValues } from "../../schemas/page.schema";

export interface ThemePreset {
  name: string;
  primary: string;
  bg: string;
  text: string;
  buttonStyle: "rounded" | "pill" | "square";
  mode?: "system" | "light" | "dark";
}

export const THEME_PRESETS: ThemePreset[] = [
  // Sáng (Light Themes)
  {
    name: "Emerald Green",
    primary: "#3D812E",
    bg: "#FFFFFF",
    text: "#1E293B",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Modern Indigo",
    primary: "#4F46E5",
    bg: "#FAFAFA",
    text: "#0F172A",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Deep Ocean",
    primary: "#0284C7",
    bg: "#F8FAFC",
    text: "#0F172A",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Warm Sunset",
    primary: "#EA580C",
    bg: "#FFFDFB",
    text: "#1C1917",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Rose Gold",
    primary: "#E11D48",
    bg: "#FFF1F2",
    text: "#4C0519",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Matcha Forest",
    primary: "#15803D",
    bg: "#F0FDF4",
    text: "#14532D",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Coffee Latte",
    primary: "#854D0E",
    bg: "#FEFCE8",
    text: "#422006",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Nordic Slate",
    primary: "#475569",
    bg: "#F1F5F9",
    text: "#0F172A",
    buttonStyle: "square",
    mode: "light",
  },

  // Tối (Dark Themes)
  {
    name: "Minimalist Dark",
    primary: "#FFFFFF",
    bg: "#09090B",
    text: "#F4F4F5",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Midnight Ocean",
    primary: "#38BDF8",
    bg: "#0F172A",
    text: "#F8FAFC",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Cyberpunk Neon",
    primary: "#A855F7",
    bg: "#180828",
    text: "#FAF5FF",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Emerald Forest Dark",
    primary: "#4ADE80",
    bg: "#052E16",
    text: "#F0FDF4",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Crimson Velvet",
    primary: "#FB7185",
    bg: "#1F040A",
    text: "#FFE4E6",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Obsidian Gold",
    primary: "#FBBF24",
    bg: "#18181B",
    text: "#FEF3C7",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Pastel Lavender",
    primary: "#8B5CF6",
    bg: "#F5F3FF",
    text: "#2E1065",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Mint Fresh",
    primary: "#0D9488",
    bg: "#F0FDFA",
    text: "#134E4A",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Sakura Blossom",
    primary: "#EC4899",
    bg: "#FDF2F8",
    text: "#831843",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Sunny Honey",
    primary: "#D97706",
    bg: "#FFFBEB",
    text: "#78350F",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Royal Sapphire",
    primary: "#2563EB",
    bg: "#EFF6FF",
    text: "#1E3A8A",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Arctic Cyan",
    primary: "#06B6D4",
    bg: "#ECFEFF",
    text: "#164E63",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Neon Hacker",
    primary: "#22C55E",
    bg: "#022C22",
    text: "#DCFCE7",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Synthwave Sunset",
    primary: "#F43F5E",
    bg: "#1E1B4B",
    text: "#FFE4E6",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Charcoal Mono",
    primary: "#94A3B8",
    bg: "#111827",
    text: "#F9FAFB",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Amethyst Luxury",
    primary: "#C084FC",
    bg: "#1E1035",
    text: "#F3E8FF",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Mocha Dark",
    primary: "#A26A42",
    bg: "#29180C",
    text: "#FEF3C7",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Pastel Peach",
    primary: "#F97316",
    bg: "#FFF7ED",
    text: "#7C2D12",
    buttonStyle: "pill",
    mode: "light",
  },
  {
    name: "Velvet Wine",
    primary: "#BE123C",
    bg: "#20040E",
    text: "#FFE4E6",
    buttonStyle: "rounded",
    mode: "dark",
  },
  {
    name: "Electric Lime",
    primary: "#84CC16",
    bg: "#0A1F05",
    text: "#ECFCCB",
    buttonStyle: "square",
    mode: "dark",
  },
  {
    name: "Copper Bronze",
    primary: "#C2410C",
    bg: "#FEF2F2",
    text: "#431407",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Tokyo Night",
    primary: "#7AA2F7",
    bg: "#1A1B26",
    text: "#C0CAF5",
    buttonStyle: "pill",
    mode: "dark",
  },
  {
    name: "Glacier Ice",
    primary: "#0EA5E9",
    bg: "#E0F2FE",
    text: "#0C4A6E",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Vintage Caramel",
    primary: "#B45309",
    bg: "#FFFBEB",
    text: "#451A03",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Coral Reef",
    primary: "#FB7185",
    bg: "#FFF1F2",
    text: "#881337",
    buttonStyle: "rounded",
    mode: "light",
  },
  {
    name: "Deep Space",
    primary: "#6366F1",
    bg: "#0B0F19",
    text: "#E0E7FF",
    buttonStyle: "rounded",
    mode: "dark",
  },
];

/**
 * Trình biên tập giao diện, màu sắc và kiểu dáng cho trang template.
 *
 * @param props - Control form react-hook-form, cờ khóa và hàm chọn preset nhanh.
 * @returns Trình biên tập theme.
 */
export function PageThemeEditor({
  control,
  setValue,
  disabled = false,
  onApplyPreset,
}: {
  control: Control<PageFormValues>;
  setValue?: UseFormSetValue<PageFormValues>;
  disabled?: boolean;
  onApplyPreset: (preset: ThemePreset) => void;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const currentPrimary = useWatch({ control, name: "primaryColor" });
  const currentButtonStyle = useWatch({ control, name: "buttonStyle" });
  const currentBg = useWatch({ control, name: "backgroundColor" });
  const currentStyleConfig = useWatch({ control, name: "styleConfig" });

  const activePresetKey = (currentStyleConfig as { themePreset?: string } | undefined)?.themePreset;

  return (
    <div className="space-y-6">
      <FormSection title={t("presets")}>
        <div className="flex flex-wrap gap-2.5">
          {THEME_PRESETS.map((p) => {
            const presetKey = p.name.toLowerCase().replace(/\s+/g, "_");
            const isMatchValues =
              p.primary.toUpperCase() === (currentPrimary ?? "").toUpperCase() &&
              p.bg.toUpperCase() === (currentBg ?? "").toUpperCase() &&
              p.buttonStyle === currentButtonStyle;
            const isActive = activePresetKey ? activePresetKey === presetKey : isMatchValues;
            return (
              <Button
                key={p.name}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onApplyPreset(p)}
                className={cn(
                  "border-border bg-card hover:border-primary/50 flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs transition-all",
                  isActive &&
                    "border-primary bg-primary/10 text-primary ring-primary/20 font-semibold ring-2",
                )}
              >
                <span
                  className="border-border size-3.5 shrink-0 rounded-full border shadow-2xs"
                  style={{ backgroundColor: p.primary }}
                />
                <span className="truncate">{p.name}</span>
                {isActive ? <Check className="text-primary size-3.5" /> : null}
              </Button>
            );
          })}
        </div>
      </FormSection>

      <FormSection title={t("sections.theme")}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={control} name="themeMode" label={t("fields.themeMode")}>
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (setValue) {
                      const isLightHex = (hex?: string) => {
                        if (!hex || !hex.startsWith("#") || hex.length < 7) return true;
                        const r = parseInt(hex.slice(1, 3), 16) || 0;
                        const g = parseInt(hex.slice(3, 5), 16) || 0;
                        const b = parseInt(hex.slice(5, 7), 16) || 0;
                        return (r * 299 + g * 587 + b * 114) / 1000 > 150;
                      };
                      if (val === "dark" && isLightHex(currentBg)) {
                        setValue("backgroundColor", "#09090B", { shouldDirty: true });
                        setValue("textColor", "#F4F4F5", { shouldDirty: true });
                      } else if (val === "light" && !isLightHex(currentBg)) {
                        setValue("backgroundColor", "#FFFFFF", { shouldDirty: true });
                        setValue("textColor", "#0F172A", { shouldDirty: true });
                      }
                    }
                  }}
                  disabled={disabled}
                  options={(["system", "light", "dark"] as const).map((mode) => ({
                    value: mode,
                    label: t(`themeModes.${mode}`),
                  }))}
                />
              )}
            </FormField>
            <FormField control={control} name="buttonStyle" label={t("fields.buttonStyle")}>
              {(field) => (
                <SelectField
                  id={field.id}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  options={(["rounded", "square", "pill"] as const).map((style) => ({
                    value: style,
                    label: t(`buttonStyles.${style}`),
                  }))}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField control={control} name="primaryColor" label={t("fields.primaryColor")}>
              {(field) => (
                <ColorInput
                  value={field.value}
                  onChange={field.onChange}
                  pickerLabel={t("fields.primaryColor")}
                  disabled={disabled}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField control={control} name="backgroundColor" label={t("fields.backgroundColor")}>
              {(field) => (
                <ColorInput
                  value={field.value}
                  onChange={field.onChange}
                  pickerLabel={t("fields.backgroundColor")}
                  disabled={disabled}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
            <FormField control={control} name="textColor" label={t("fields.textColor")}>
              {(field) => (
                <ColorInput
                  value={field.value}
                  onChange={field.onChange}
                  pickerLabel={t("fields.textColor")}
                  disabled={disabled}
                  invalid={field["aria-invalid"]}
                />
              )}
            </FormField>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
