"use client";

import { cn } from "cn";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, type Control, type UseFormSetValue, useWatch } from "react-hook-form";

import { AttachmentImageUploadView } from "@/modules/system/views/attachment/attachment-image-upload-view";
import { ColorInput } from "@/shares/components/common/color-input";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";

import {
  buildPatternStyle,
  COLORED_BACKDROP_PRESETS,
  type ColoredBackdropPreset,
  PAGE_PATTERN_KEYS,
} from "../../lib/page-patterns";
import { isLightHexColor } from "../../lib/page-theme";
import type { PageFormValues } from "../../schemas/page.schema";

const BG_TYPES = ["solid", "gradient", "image", "pattern"] as const;
const GRADIENT_TYPES = ["linear", "radial"] as const;
const BG_FITS = ["cover", "contain", "tile"] as const;
const AMBIENT_MOTIONS = ["none", "gradient_flow", "floating_orbs"] as const;

/**
 * Trình biên tập Nền & Hiệu ứng môi trường (Solid, Gradient, Ảnh nền toàn trang, Pattern, Ambient Motion).
 *
 * @param props - Control form, setValue và cờ khóa.
 * @returns Khu vực cấu hình nền trang.
 */
export function PageBackgroundEditor({
  control,
  setValue,
  disabled = false,
}: {
  control: Control<PageFormValues>;
  setValue: UseFormSetValue<PageFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.appearance");
  const styleConfig = (useWatch({ control, name: "styleConfig" }) ?? {}) as Record<string, unknown>;

  const bgType = (styleConfig.backgroundType as string) ?? "solid";
  const gradientType = (styleConfig.gradientType as string) ?? "linear";
  const gradientAngle = Number(styleConfig.gradientAngle ?? 135);
  const gradientColors = Array.isArray(styleConfig.gradientColors)
    ? (styleConfig.gradientColors as string[])
    : ["#0F172A", "#1E1B4B", "#312E81"];
  const patternKey = (styleConfig.patternKey as string) ?? "dots";
  const backgroundFit = (styleConfig.backgroundFit as string) ?? "cover";
  const backgroundBlur = Number(styleConfig.backgroundBlur ?? 0);
  const overlayColor = (styleConfig.overlayColor as string) ?? "#000000";
  const overlayOpacity = Number(styleConfig.overlayOpacity ?? 35);
  const ambientMotion = (styleConfig.ambientMotion as string) ?? "none";

  const patchStyle = (patch: Record<string, unknown>) => {
    setValue(
      "styleConfig",
      {
        ...styleConfig,
        ...patch,
      },
      { shouldDirty: true },
    );
  };

  const currentBgColor = (useWatch({ control, name: "backgroundColor" }) ?? "").toUpperCase();
  const currentTextColor = useWatch({ control, name: "textColor" }) ?? "";

  const handleBackgroundTypeChange = (nextType: string) => {
    if (nextType === "image") {
      const darkOverlay = !isLightHexColor(overlayColor);
      if (darkOverlay && (!currentTextColor || !isLightHexColor(currentTextColor))) {
        setValue("themeMode", "dark", { shouldDirty: true, shouldValidate: true });
        setValue("textColor", "#F8FAFC", { shouldDirty: true, shouldValidate: true });
      }
    }
    patchStyle({ backgroundType: nextType });
  };

  const applyColoredBackdrop = (preset: ColoredBackdropPreset) => {
    setValue("themeMode", preset.mode, { shouldDirty: true, shouldValidate: true });
    setValue("backgroundColor", preset.bg, { shouldDirty: true, shouldValidate: true });
    setValue("textColor", preset.text, { shouldDirty: true, shouldValidate: true });
    setValue("primaryColor", preset.primary, { shouldDirty: true, shouldValidate: true });
    patchStyle({
      backgroundType: "pattern",
      patternKey: preset.patternKey,
      backgroundColor: preset.bg,
      textColor: preset.text,
      primaryColor: preset.primary,
    });
  };

  return (
    <FormSection title={t("background.title")}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("background.type")}</Label>
            <SelectField
              value={bgType}
              onValueChange={handleBackgroundTypeChange}
              disabled={disabled}
              options={BG_TYPES.map((type) => ({
                value: type,
                label: t(`background.types.${type}`),
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("background.ambientMotion")}</Label>
            <SelectField
              value={ambientMotion}
              onValueChange={(val) => patchStyle({ ambientMotion: val })}
              disabled={disabled}
              options={AMBIENT_MOTIONS.map((m) => ({
                value: m,
                label: t(`background.ambientMotions.${m}`),
              }))}
            />
          </div>
        </div>

        {bgType === "gradient" ? (
          <div className="border-border/80 bg-muted/20 space-y-4 rounded-xl border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("background.gradientType")}</Label>
                <SelectField
                  value={gradientType}
                  onValueChange={(val) => patchStyle({ gradientType: val })}
                  disabled={disabled}
                  options={GRADIENT_TYPES.map((gt) => ({
                    value: gt,
                    label: t(`background.gradientTypes.${gt}`),
                  }))}
                />
              </div>
              {gradientType === "linear" ? (
                <div className="space-y-2">
                  <Label>{t("background.gradientAngle", { angle: gradientAngle })}</Label>
                  <Input
                    type="range"
                    min={0}
                    max={360}
                    value={gradientAngle}
                    onChange={(e) => patchStyle({ gradientAngle: Number(e.target.value) })}
                    disabled={disabled}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {gradientColors.slice(0, 3).map((color, index) => (
                <div key={index} className="space-y-1.5">
                  <Label className="text-xs">
                    {t("background.gradientColor", { index: index + 1 })}
                  </Label>
                  <ColorInput
                    value={color}
                    onChange={(nextColor) => {
                      const next = [...gradientColors];
                      next[index] = nextColor;
                      patchStyle({ gradientColors: next });
                    }}
                    pickerLabel={t("background.gradientColor", { index: index + 1 })}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {gradientColors.length < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => patchStyle({ gradientColors: [...gradientColors, "#4F46E5"] })}
                >
                  {t("background.addColorStop")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => patchStyle({ gradientColors: gradientColors.slice(0, 2) })}
                >
                  {t("background.removeColorStop")}
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {bgType === "pattern" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("background.coloredBackdropsTitle")}</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {COLORED_BACKDROP_PRESETS.map((preset) => {
                  const isSelected =
                    patternKey === preset.patternKey && currentBgColor === preset.bg.toUpperCase();
                  return (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => applyColoredBackdrop(preset)}
                      className={cn(
                        "border-border bg-card hover:border-primary/60 group relative flex h-auto flex-col items-stretch gap-0 overflow-hidden rounded-xl border p-0 text-left font-normal transition-all",
                        isSelected && "border-primary ring-primary/25 ring-2",
                      )}
                    >
                      <div
                        className="relative h-14 w-full border-b"
                        style={{
                          backgroundColor: preset.bg,
                          ...buildPatternStyle(preset.patternKey),
                          ["--primary" as string]: preset.primary,
                          ["--ring" as string]: preset.primary,
                          ["--foreground" as string]: preset.text,
                        }}
                      >
                        <span
                          className="absolute bottom-1.5 left-2 size-3 rounded-full border border-white/40 shadow-xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                        {isSelected ? (
                          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full shadow-xs">
                            <Check className="size-2.5" />
                          </span>
                        ) : null}
                      </div>
                      <span className="text-foreground truncate px-2 py-1.5 text-[11px] font-medium">
                        {t(`background.coloredBackdrops.${preset.id}` as Parameters<typeof t>[0])}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label>{t("background.pattern")}</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PAGE_PATTERN_KEYS.map((key) => {
                  const isSelected = patternKey === key;
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => patchStyle({ patternKey: key })}
                      className={cn(
                        "border-border bg-card hover:border-primary/60 group relative flex h-auto flex-col items-stretch gap-0 overflow-hidden rounded-xl border p-0 text-left font-normal transition-all",
                        isSelected && "border-primary ring-primary/25 ring-2",
                      )}
                    >
                      <div
                        className="bg-background relative h-14 w-full border-b"
                        style={buildPatternStyle(key)}
                      >
                        {isSelected ? (
                          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full shadow-xs">
                            <Check className="size-2.5" />
                          </span>
                        ) : null}
                      </div>
                      <span className="text-foreground truncate px-2 py-1.5 text-[11px] font-medium">
                        {t(`background.patterns.${key}`)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {bgType === "image" ? (
          <div className="border-border/80 bg-muted/20 space-y-4 rounded-xl border p-4">
            <FormField control={control} name="backgroundImage" label={t("background.image")}>
              {() => (
                <Controller
                  control={control}
                  name="backgroundImage"
                  render={({ field }) => (
                    <AttachmentImageUploadView
                      value={field.value}
                      onChange={field.onChange}
                      shape="square"
                      hideHint
                      disabled={disabled}
                    />
                  )}
                />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("background.fit")}</Label>
                <SelectField
                  value={backgroundFit}
                  onValueChange={(val) => patchStyle({ backgroundFit: val })}
                  disabled={disabled}
                  options={BG_FITS.map((fit) => ({
                    value: fit,
                    label: t(`background.fits.${fit}`),
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("background.blur", { value: backgroundBlur })}</Label>
                <Input
                  type="range"
                  min={0}
                  max={24}
                  value={backgroundBlur}
                  onChange={(e) => patchStyle({ backgroundBlur: Number(e.target.value) })}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("background.overlayColor")}</Label>
                <ColorInput
                  value={overlayColor}
                  onChange={(val) => patchStyle({ overlayColor: val })}
                  pickerLabel={t("background.overlayColor")}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("background.overlayOpacity", { value: overlayOpacity })}</Label>
                <Input
                  type="range"
                  min={0}
                  max={85}
                  value={overlayOpacity}
                  onChange={(e) => patchStyle({ overlayOpacity: Number(e.target.value) })}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}
