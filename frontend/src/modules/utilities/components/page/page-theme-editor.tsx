"use client";

import { Check, Moon, Search, SunMedium, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import { cn } from "cn";

import { ColorInput } from "@/shares/components/common/color-input";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { THEME_PRESETS, type ThemePreset } from "../../constants/page-theme-presets";
import { isLightHexColor } from "../../lib/page-theme";
import type { PageFormValues } from "../../schemas/page.schema";
import { PageBackgroundEditor } from "./page-background-editor";
import { PageBlockStyleEditor } from "./page-block-style-editor";
import { PageHeaderStyleEditor } from "./page-header-style-editor";
import { PageTypographyLayoutEditor } from "./page-typography-layout-editor";

/**
 * Trình biên tập giao diện, nền trang, đầu trang, hiệu ứng thẻ và phông chữ cho trang template.
 *
 * @param props - Control form, setValue, loại trang, cờ khóa và hàm chọn preset nhanh.
 * @returns Trình biên tập theme 5 nhóm trực quan.
 */
export function PageThemeEditor({
  control,
  setValue,
  pageType = "BIO",
  disabled = false,
  onApplyPreset,
}: {
  control: Control<PageFormValues>;
  setValue: UseFormSetValue<PageFormValues>;
  pageType?: string;
  disabled?: boolean;
  onApplyPreset: (preset: ThemePreset) => void;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const tApp = useTranslations("utilities.customPages.pages.appearance");
  const tTable = useTranslations("common.table");
  const currentPrimary = useWatch({ control, name: "primaryColor" });
  const currentButtonStyle = useWatch({ control, name: "buttonStyle" });
  const currentBg = useWatch({ control, name: "backgroundColor" });
  const currentStyleConfig = useWatch({ control, name: "styleConfig" });

  const activePresetKey = (currentStyleConfig as { themePreset?: string } | undefined)?.themePreset;

  const [presetTab, setPresetTab] = useState<"all" | "light" | "dark">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalLight = useMemo(() => THEME_PRESETS.filter((p) => p.mode === "light").length, []);
  const totalDark = useMemo(() => THEME_PRESETS.filter((p) => p.mode === "dark").length, []);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return THEME_PRESETS.filter((p) => {
      const matchMode = presetTab === "all" || p.mode === presetTab;
      const matchQuery = !q || p.name.toLowerCase().includes(q);
      return matchMode && matchQuery;
    });
  }, [presetTab, searchQuery]);

  const lightPresets = useMemo(
    () => filteredPresets.filter((p) => p.mode === "light"),
    [filteredPresets],
  );

  const darkPresets = useMemo(
    () => filteredPresets.filter((p) => p.mode === "dark"),
    [filteredPresets],
  );

  const renderPresetCard = (p: ThemePreset) => {
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
          "border-border bg-card hover:border-primary/50 relative flex h-auto w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-xs font-medium shadow-2xs transition-all duration-150",
          isActive &&
            "border-primary bg-primary/10 text-primary ring-primary/20 font-semibold ring-2",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="border-border/80 relative flex size-5.5 shrink-0 items-center justify-center rounded-full border shadow-2xs"
            style={{ backgroundColor: p.bg }}
          >
            <span
              className="size-2.5 rounded-full shadow-2xs"
              style={{ backgroundColor: p.primary }}
            />
          </span>
          <span className="truncate">{p.name}</span>
        </div>
        {isActive ? <Check className="text-primary size-3.5 shrink-0" /> : null}
      </Button>
    );
  };

  return (
    <Tabs defaultValue="presets" className="space-y-4">
      <TabsList className="w-full scrollbar-none justify-start overflow-x-auto">
        <TabsTrigger value="presets" className="text-xs font-medium">
          {tApp("tabs.presets")}
        </TabsTrigger>
        <TabsTrigger value="background" className="text-xs font-medium">
          {tApp("tabs.background")}
        </TabsTrigger>
        <TabsTrigger value="header" className="text-xs font-medium">
          {tApp("tabs.header")}
        </TabsTrigger>
        <TabsTrigger value="blocks" className="text-xs font-medium">
          {tApp("tabs.blocks")}
        </TabsTrigger>
        <TabsTrigger value="typography" className="text-xs font-medium">
          {tApp("tabs.typography")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="presets" className="space-y-6">
        <FormSection title={t("presets")}>
          <div className="space-y-4">
            {/* Bộ lọc theo cụm & Tìm kiếm nhanh */}
            <div className="space-y-2.5">
              <div className="border-border bg-muted/40 flex w-fit items-center gap-1 rounded-xl border p-1">
                <Button
                  type="button"
                  variant={presetTab === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresetTab("all")}
                  disabled={disabled}
                  className="h-7 rounded-lg px-2.5 text-xs font-medium"
                >
                  <span>{t("presetsAll", { count: THEME_PRESETS.length })}</span>
                </Button>
                <Button
                  type="button"
                  variant={presetTab === "light" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresetTab("light")}
                  disabled={disabled}
                  className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                >
                  <SunMedium className="size-3.5 text-amber-500" />
                  <span>{t("presetsLight", { count: totalLight })}</span>
                </Button>
                <Button
                  type="button"
                  variant={presetTab === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresetTab("dark")}
                  disabled={disabled}
                  className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                >
                  <Moon className="size-3.5 text-sky-400" />
                  <span>{t("presetsDark", { count: totalDark })}</span>
                </Button>
              </div>

              {/* Ô tìm kiếm chuyển xuống dưới với chiều rộng linh hoạt */}
              <div className="relative w-full">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder={t("presetsSearchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={disabled}
                  className="h-8 pr-8 pl-8 text-xs"
                />
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-6 -translate-y-1/2 p-0"
                  >
                    <X className="size-3" />
                    <span className="sr-only">{tTable("clearSearch")}</span>
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Cụm 1: Giao diện sáng (Light Themes) */}
            {(presetTab === "all" || presetTab === "light") && lightPresets.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <div className="border-border/60 flex items-center justify-between border-b pb-2">
                  <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                    <SunMedium className="size-4 text-amber-500" />
                    <span>{t("presetsLightSection")}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {lightPresets.length}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground hidden text-[11px] sm:inline">
                    {t("presetsLightSectionDesc")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {lightPresets.map(renderPresetCard)}
                </div>
              </div>
            ) : null}

            {/* Cụm 2: Giao diện tối (Dark Themes) */}
            {(presetTab === "all" || presetTab === "dark") && darkPresets.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                <div className="border-border/60 flex items-center justify-between border-b pb-2">
                  <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                    <Moon className="size-4 text-sky-400" />
                    <span>{t("presetsDarkSection")}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {darkPresets.length}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground hidden text-[11px] sm:inline">
                    {t("presetsDarkSectionDesc")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {darkPresets.map(renderPresetCard)}
                </div>
              </div>
            ) : null}

            {filteredPresets.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">{t("presetsEmpty")}</p>
            ) : null}
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
                        if (val === "system") {
                          setValue("backgroundColor", "", { shouldDirty: true });
                          setValue("textColor", "", { shouldDirty: true });
                        } else if (val === "dark" && isLightHexColor(currentBg)) {
                          setValue("backgroundColor", "#09090B", { shouldDirty: true });
                          setValue("textColor", "#F4F4F5", { shouldDirty: true });
                        } else if (val === "light" && !isLightHexColor(currentBg)) {
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
              <FormField
                control={control}
                name="backgroundColor"
                label={t("fields.backgroundColor")}
              >
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
      </TabsContent>

      <TabsContent value="background">
        <PageBackgroundEditor control={control} setValue={setValue} disabled={disabled} />
      </TabsContent>

      <TabsContent value="header">
        <PageHeaderStyleEditor control={control} setValue={setValue} disabled={disabled} />
      </TabsContent>

      <TabsContent value="blocks">
        <PageBlockStyleEditor
          control={control}
          setValue={setValue}
          pageType={pageType}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="typography">
        <PageTypographyLayoutEditor control={control} setValue={setValue} disabled={disabled} />
      </TabsContent>
    </Tabs>
  );
}
