"use client";

import { useTranslations } from "next-intl";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";

import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Checkbox } from "@/shares/components/ui/checkbox";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";

import type { PageFormValues } from "../../schemas/page.schema";

const HEADER_LAYOUTS = ["centered", "banner_overlap", "hero_card", "editorial_left"] as const;
const AVATAR_SHAPES = ["circle", "squircle", "square"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const AVATAR_RINGS = ["none", "solid", "gradient_glow"] as const;
const SOCIAL_POSITIONS = ["top", "bottom", "hidden"] as const;

/**
 * Trình biên tập Đầu trang & Thương hiệu (Layout header, Avatar, Cover, Status pill, nút chia sẻ).
 *
 * @param props - Control form, setValue và cờ khóa.
 * @returns Khu vực cấu hình đầu trang.
 */
export function PageHeaderStyleEditor({
  control,
  setValue,
  disabled = false,
}: {
  control: Control<PageFormValues>;
  setValue: UseFormSetValue<PageFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.appearance.header");
  const styleConfig = (useWatch({ control, name: "styleConfig" }) ?? {}) as Record<string, unknown>;

  const headerLayout = (styleConfig.headerLayout as string) ?? "centered";
  const avatarShape = (styleConfig.avatarShape as string) ?? "circle";
  const avatarSize = (styleConfig.avatarSize as string) ?? "md";
  const avatarRing = (styleConfig.avatarRing as string) ?? "solid";
  const coverHeight = (styleConfig.coverHeight as string) ?? "md";
  const socialPosition = (styleConfig.socialPosition as string) ?? "top";
  const statusPill = (styleConfig.statusPill as string) ?? "";
  const showVerifiedBadge = styleConfig.showVerifiedBadge !== false;
  const coverFade = styleConfig.coverFade !== false;
  const showShareButton = styleConfig.showShareButton !== false;

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
            <Label>{t("layout")}</Label>
            <SelectField
              value={headerLayout}
              onValueChange={(val) => patchStyle({ headerLayout: val })}
              disabled={disabled}
              options={HEADER_LAYOUTS.map((item) => ({
                value: item,
                label: t(`layouts.${item}`),
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("statusPill")}</Label>
            <Input
              value={statusPill}
              maxLength={60}
              placeholder={t("statusPillPlaceholder")}
              onChange={(e) => patchStyle({ statusPill: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("avatarShape")}</Label>
            <SelectField
              value={avatarShape}
              onValueChange={(val) => patchStyle({ avatarShape: val })}
              disabled={disabled}
              options={AVATAR_SHAPES.map((item) => ({
                value: item,
                label: t(`avatarShapes.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("avatarSize")}</Label>
            <SelectField
              value={avatarSize}
              onValueChange={(val) => patchStyle({ avatarSize: val })}
              disabled={disabled}
              options={SIZES.map((item) => ({
                value: item,
                label: t(`sizes.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("avatarRing")}</Label>
            <SelectField
              value={avatarRing}
              onValueChange={(val) => patchStyle({ avatarRing: val })}
              disabled={disabled}
              options={AVATAR_RINGS.map((item) => ({
                value: item,
                label: t(`avatarRings.${item}`),
              }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("coverHeight")}</Label>
            <SelectField
              value={coverHeight}
              onValueChange={(val) => patchStyle({ coverHeight: val })}
              disabled={disabled}
              options={SIZES.map((item) => ({
                value: item,
                label: t(`sizes.${item}`),
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("socialPosition")}</Label>
            <SelectField
              value={socialPosition}
              onValueChange={(val) => patchStyle({ socialPosition: val })}
              disabled={disabled}
              options={SOCIAL_POSITIONS.map((item) => ({
                value: item,
                label: t(`socialPositions.${item}`),
              }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-5 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="header-verified-badge"
              checked={showVerifiedBadge}
              onCheckedChange={(checked) => patchStyle({ showVerifiedBadge: Boolean(checked) })}
              disabled={disabled}
            />
            <Label htmlFor="header-verified-badge" className="cursor-pointer text-xs font-medium">
              {t("showVerifiedBadge")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="header-cover-fade"
              checked={coverFade}
              onCheckedChange={(checked) => patchStyle({ coverFade: Boolean(checked) })}
              disabled={disabled}
            />
            <Label htmlFor="header-cover-fade" className="cursor-pointer text-xs font-medium">
              {t("coverFade")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="header-share-button"
              checked={showShareButton}
              onCheckedChange={(checked) => patchStyle({ showShareButton: Boolean(checked) })}
              disabled={disabled}
            />
            <Label htmlFor="header-share-button" className="cursor-pointer text-xs font-medium">
              {t("showShareButton")}
            </Label>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
