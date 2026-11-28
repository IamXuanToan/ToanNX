"use client";

import { useTranslations } from "next-intl";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";

import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Label } from "@/shares/components/ui/label";

import { PAGE_TYPE } from "../../constants/page-constants";
import type { PageFormValues } from "../../schemas/page.schema";

const SURFACE_STYLES = ["solid", "outline", "soft", "glass", "elevated", "hard_shadow"] as const;
const CARD_RADII = ["0px", "4px", "8px", "12px", "20px"] as const;
const HOVER_EFFECTS = ["none", "lift", "scale", "glow", "shine", "hard_push"] as const;
const ENTRANCE_ANIMATIONS = ["none", "fade_up", "scale_in", "blur_in"] as const;
const HIGHLIGHT_EFFECTS = ["none", "pulse_ring", "wiggle", "shimmer"] as const;
const LINK_LAYOUTS = [
  "classic_bar",
  "thumbnail_card",
  "featured_hero",
  "grid_2col",
  "bento_grid",
  "compact_pills",
] as const;
const AFFILIATE_LAYOUTS = ["grid", "list", "links", "carousel_featured"] as const;

/**
 * Trình biên tập Bề mặt thẻ, Hiệu ứng Hover/Xuất hiện và Bố cục khối nội dung.
 *
 * @param props - Control form, setValue, loại trang và cờ khóa.
 * @returns Khu vực cấu hình thẻ & hiệu ứng.
 */
export function PageBlockStyleEditor({
  control,
  setValue,
  pageType,
  disabled = false,
}: {
  control: Control<PageFormValues>;
  setValue: UseFormSetValue<PageFormValues>;
  pageType: string;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.appearance.blocks");
  const styleConfig = (useWatch({ control, name: "styleConfig" }) ?? {}) as Record<string, unknown>;

  const surfaceStyle = (styleConfig.surfaceStyle as string) ?? "solid";
  const rawCardRadius = (styleConfig.cardRadius as string) ?? "12px";
  const cardRadius = (CARD_RADII as readonly string[]).includes(rawCardRadius)
    ? rawCardRadius
    : "12px";
  const hoverEffect = (styleConfig.hoverEffect as string) ?? "lift";
  const entranceAnimation = (styleConfig.entranceAnimation as string) ?? "none";
  const highlightEffect = (styleConfig.highlightEffect as string) ?? "none";
  const linkLayout = (styleConfig.linkLayout as string) ?? "classic_bar";
  const affiliateLayout = (styleConfig.layout as string) ?? "grid";
  const stickyFilterBar = styleConfig.stickyFilterBar !== false;

  const isBio = pageType === PAGE_TYPE.BIO || pageType === PAGE_TYPE.PORTFOLIO;
  const isAffiliate = pageType === PAGE_TYPE.AFFILIATE || pageType === PAGE_TYPE.PRODUCT_CATALOG;

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

  return (
    <FormSection title={t("title")}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("surfaceStyle")}</Label>
            <SelectField
              value={surfaceStyle}
              onValueChange={(val) => patchStyle({ surfaceStyle: val })}
              disabled={disabled}
              options={SURFACE_STYLES.map((item) => ({
                value: item,
                label: t(`surfaces.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("cardRadius")}</Label>
            <SelectField
              value={cardRadius}
              onValueChange={(val) => patchStyle({ cardRadius: val })}
              disabled={disabled}
              options={CARD_RADII.map((item) => ({
                value: item,
                label: t(`radii.${item}`),
              }))}
            />
          </div>
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("hoverEffect")}</Label>
            <SelectField
              value={hoverEffect}
              onValueChange={(val) => patchStyle({ hoverEffect: val })}
              disabled={disabled}
              options={HOVER_EFFECTS.map((item) => ({
                value: item,
                label: t(`hovers.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("entranceAnimation")}</Label>
            <SelectField
              value={entranceAnimation}
              onValueChange={(val) => patchStyle({ entranceAnimation: val })}
              disabled={disabled}
              options={ENTRANCE_ANIMATIONS.map((item) => ({
                value: item,
                label: t(`entrances.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("highlightEffect")}</Label>
            <SelectField
              value={highlightEffect}
              onValueChange={(val) => patchStyle({ highlightEffect: val })}
              disabled={disabled}
              options={HIGHLIGHT_EFFECTS.map((item) => ({
                value: item,
                label: t(`highlights.${item}`),
              }))}
            />
          </div>
        </div>

        {isBio ? (
          <div className="space-y-2">
            <Label>{t("linkLayout")}</Label>
            <SelectField
              value={linkLayout}
              onValueChange={(val) => patchStyle({ linkLayout: val })}
              disabled={disabled}
              options={LINK_LAYOUTS.map((item) => ({
                value: item,
                label: t(`linkLayouts.${item}`),
              }))}
            />
          </div>
        ) : null}

        {isAffiliate ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("affiliateLayout")}</Label>
              <SelectField
                value={affiliateLayout}
                onValueChange={(val) => patchStyle({ layout: val })}
                disabled={disabled}
                options={AFFILIATE_LAYOUTS.map((item) => ({
                  value: item,
                  label: t(`affiliateLayouts.${item}`),
                }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="affiliate-sticky-filter"
                checked={stickyFilterBar}
                onCheckedChange={(checked) => patchStyle({ stickyFilterBar: Boolean(checked) })}
                disabled={disabled}
              />
              <Label
                htmlFor="affiliate-sticky-filter"
                className="cursor-pointer text-xs font-medium"
              >
                {t("stickyFilterBar")}
              </Label>
            </div>
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}
