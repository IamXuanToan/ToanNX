"use client";

import { useTranslations } from "next-intl";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";

import { FormSection } from "@/shares/components/common/form-section";
import { SelectField } from "@/shares/components/common/select-field";
import { Label } from "@/shares/components/ui/label";

import type { PageFormValues } from "../../schemas/page.schema";

const FONT_FAMILIES = [
  "inter",
  "plus_jakarta",
  "be_vietnam",
  "playfair",
  "jetbrains_mono",
] as const;
const CONTAINER_WIDTHS = ["compact", "standard", "wide"] as const;
const BLOCK_SPACINGS = ["compact", "normal", "relaxed"] as const;
const FOOTER_STYLES = ["minimal", "pill", "hidden"] as const;

/**
 * Trình biên tập Phông chữ, Độ rộng khung chứa và Khoảng cách khối.
 *
 * @param props - Control form, setValue và cờ khóa.
 * @returns Khu vực cấu hình typography & khung trang.
 */
export function PageTypographyLayoutEditor({
  control,
  setValue,
  disabled = false,
}: {
  control: Control<PageFormValues>;
  setValue: UseFormSetValue<PageFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("utilities.customPages.pages.appearance.typography");
  const styleConfig = (useWatch({ control, name: "styleConfig" }) ?? {}) as Record<string, unknown>;

  const fontFamily = (styleConfig.fontFamily as string) ?? "inter";
  const containerWidth = (styleConfig.containerWidth as string) ?? "standard";
  const blockSpacing = (styleConfig.blockSpacing as string) ?? "normal";
  const footerStyle = (styleConfig.footerStyle as string) ?? "minimal";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("fontFamily")}</Label>
          <SelectField
            value={fontFamily}
            onValueChange={(val) => patchStyle({ fontFamily: val })}
            disabled={disabled}
            options={FONT_FAMILIES.map((item) => ({
              value: item,
              label: t(`fonts.${item}`),
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("containerWidth")}</Label>
          <SelectField
            value={containerWidth}
            onValueChange={(val) => patchStyle({ containerWidth: val })}
            disabled={disabled}
            options={CONTAINER_WIDTHS.map((item) => ({
              value: item,
              label: t(`widths.${item}`),
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("blockSpacing")}</Label>
          <SelectField
            value={blockSpacing}
            onValueChange={(val) => patchStyle({ blockSpacing: val })}
            disabled={disabled}
            options={BLOCK_SPACINGS.map((item) => ({
              value: item,
              label: t(`spacings.${item}`),
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("footerStyle")}</Label>
          <SelectField
            value={footerStyle}
            onValueChange={(val) => patchStyle({ footerStyle: val })}
            disabled={disabled}
            options={FOOTER_STYLES.map((item) => ({
              value: item,
              label: t(`footers.${item}`),
            }))}
          />
        </div>
      </div>
    </FormSection>
  );
}
