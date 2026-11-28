"use client";

import {
  Ban,
  Check,
  ImageIcon,
  Link2,
  Loader2,
  PackagePlus,
  Pencil,
  Sparkles,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "cn";

import { AttachmentImageUploadView } from "@/modules/system/views/attachment/attachment-image-upload-view";
import { ColorInput } from "@/shares/components/common/color-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import { Checkbox } from "@/shares/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { formatDisplayNumber } from "@/shares/lib/number-format";

import { DEFAULT_AFFILIATE_PLATFORMS } from "../../constants/affiliate-platforms";
import type {
  AffiliateCategory,
  AffiliateItem,
  AffiliatePlatformConfig,
} from "../../types/page.types";
import { useQuickAddModal } from "./hooks/use-quick-add-modal";

const BADGE_PRESETS = [
  { key: "recommended", defaultBg: "#EF4444", defaultText: "#FFFFFF" },
  { key: "featured", defaultBg: "#F97316", defaultText: "#FFFFFF" },
  { key: "bestSeller", defaultBg: "#10B981", defaultText: "#FFFFFF" },
  { key: "sale", defaultBg: "#EF4444", defaultText: "#FFFFFF" },
  { key: "hotDeal", defaultBg: "#DC2626", defaultText: "#FFFFFF" },
  { key: "newest", defaultBg: "#3B82F6", defaultText: "#FFFFFF" },
  { key: "discount50", defaultBg: "#8B5CF6", defaultText: "#FFFFFF" },
] as const;

const BADGE_COLOR_PRESETS = [
  { key: "red", bg: "#EF4444", text: "#FFFFFF" },
  { key: "orange", bg: "#F97316", text: "#FFFFFF" },
  { key: "green", bg: "#10B981", text: "#FFFFFF" },
  { key: "blue", bg: "#3B82F6", text: "#FFFFFF" },
  { key: "purple", bg: "#8B5CF6", text: "#FFFFFF" },
  { key: "black", bg: "#18181B", text: "#FFFFFF" },
  { key: "light", bg: "#F1F5F9", text: "#0F172A" },
] as const;

/**
 * Modal thêm mới và chỉnh sửa sản phẩm Affiliate to rộng, hỗ trợ lấy thông tin tự động từ URL,
 * tùy chọn tải ảnh lên từ thư viện hoặc dán link ảnh trực tiếp, và điền đầy đủ giá, danh mục, nhãn.
 *
 * @param props - Trạng thái mở, danh mục hiện có, item đang sửa, callback thêm/lưu và đóng.
 * @returns Dialog modal quản lý sản phẩm.
 */
export function QuickAddModal({
  open,
  categories,
  platforms = DEFAULT_AFFILIATE_PLATFORMS,
  editingItem,
  initialMode = "manual",
  onAdd,
  onSave,
  onClose,
}: {
  open: boolean;
  categories: AffiliateCategory[];
  platforms?: AffiliatePlatformConfig[];
  editingItem?: AffiliateItem | null;
  initialMode?: "quick" | "manual";
  onAdd?: (item: AffiliateItem) => void;
  onSave?: (item: AffiliateItem) => void;
  onClose: () => void;
}) {
  const t = useTranslations("utilities.customPages.quickAdd");
  const [currentMode, setCurrentMode] = useState<"quick" | "manual">(initialMode);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCurrentMode(initialMode);
    }
  }

  const {
    url,
    setUrl,
    loading,
    title,
    setTitle,
    imageUrl,
    setImageUrl,
    price,
    setPrice,
    originalPrice,
    setOriginalPrice,
    showPrice,
    setShowPrice,
    badgeText,
    setBadgeText,
    badgeBgColor,
    setBadgeBgColor,
    badgeTextColor,
    setBadgeTextColor,
    categoryId,
    setCategoryId,
    platform,
    setPlatform,
    imageTab,
    setImageTab,
    uploadedFile,
    handleUploadedFileChange,
    handleFetch,
    handleConfirm,
    isEditing,
  } = useQuickAddModal({ onAdd, onSave, onClose, editingItem, platforms });

  const platformOptions = [
    ...platforms
      .filter((p) => p.isVisible !== false && p.code)
      .map((p) => ({ value: p.code, label: p.name })),
    { value: "custom", label: t("platformCustom") },
  ];

  const categoryOptions = [
    { value: "", label: t("selectCategory") },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {isEditing ? (
              <>
                <Pencil className="text-primary size-4.5" />
                <span>{t("editTitle")}</span>
              </>
            ) : currentMode === "quick" ? (
              <>
                <Sparkles className="text-primary size-4.5" />
                <span>{t("addQuickTitle")}</span>
              </>
            ) : (
              <>
                <PackagePlus className="text-primary size-4.5" />
                <span>{t("addTitle")}</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bộ chuyển đổi chế độ Thêm thường vs Thêm nhanh khi thêm mới */}
          {!isEditing ? (
            <div className="bg-muted/50 border-border flex items-center rounded-xl border p-1">
              <Button
                type="button"
                variant={currentMode === "manual" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentMode("manual")}
                className={cn(
                  "flex-1 gap-1.5 text-xs font-semibold",
                  currentMode === "manual" && "shadow-xs",
                )}
              >
                <PackagePlus className="size-3.5" />
                <span>{t("addManual")}</span>
              </Button>
              <Button
                type="button"
                variant={currentMode === "quick" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentMode("quick")}
                className={cn(
                  "flex-1 gap-1.5 text-xs font-semibold",
                  currentMode === "quick" && "shadow-xs",
                )}
              >
                <Sparkles className="text-primary size-3.5" />
                <span>{t("addQuick")}</span>
              </Button>
            </div>
          ) : null}

          {/* 1. Nhập URL và Lấy thông tin tự động */}
          <div className="border-border bg-muted/20 space-y-2 rounded-xl border p-3.5">
            <Label
              htmlFor="quick-add-url"
              className="flex items-center gap-1 text-xs font-semibold"
            >
              <span>{currentMode === "quick" ? t("urlLabel") : t("manualUrlLabel")}</span>
              <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                *
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="quick-add-url"
                placeholder={
                  currentMode === "quick" ? t("urlPlaceholder") : t("manualUrlPlaceholder")
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                onClick={handleFetch}
                disabled={loading || !url.trim()}
                className="h-9 shrink-0 gap-1.5 px-3 text-xs font-medium"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>
                  {loading
                    ? t("fetching")
                    : currentMode === "quick"
                      ? t("fetchButton")
                      : t("fetchManual")}
                </span>
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              {currentMode === "quick" ? t("quickUrlHint") : t("manualUrlHint")}
            </p>
          </div>

          {/* 2. Cấu hình chi tiết sản phẩm */}
          <div className="space-y-4">
            {/* Tên sản phẩm */}
            <div className="space-y-1.5">
              <Label
                htmlFor="quick-add-title"
                className="flex items-center gap-1 text-xs font-medium"
              >
                <span>{t("titleLabel")}</span>
                <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                  *
                </span>
              </Label>
              <Input
                id="quick-add-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="h-9 text-xs font-medium"
              />
            </div>

            {/* Hình ảnh sản phẩm (Hỗ trợ URL hoặc Tải từ thư viện) */}
            <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-semibold">{t("imageSection")}</Label>
                <div className="border-border bg-background flex items-center rounded-lg border p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={imageTab === "url" ? "secondary" : "ghost"}
                    onClick={() => setImageTab("url")}
                    className="h-6.5 gap-1 px-2.5 text-[11px]"
                  >
                    <Link2 className="size-3" />
                    <span>{t("imageTabUrl")}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={imageTab === "upload" ? "secondary" : "ghost"}
                    onClick={() => setImageTab("upload")}
                    className="h-6.5 gap-1 px-2.5 text-[11px]"
                  >
                    <Upload className="size-3" />
                    <span>{t("imageTabUpload")}</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
                {/* Khung xem trước ảnh */}
                <div className="border-border bg-muted/60 relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-inner sm:size-24">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title || t("imagePreviewAlt")}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-1 p-2 text-center text-[10px]">
                      <ImageIcon className="size-5 opacity-40" />
                      <span>{t("noImage")}</span>
                    </div>
                  )}
                </div>

                {/* Nhập URL hoặc Chọn từ thư viện */}
                <div className="flex-1 space-y-2">
                  {imageTab === "url" ? (
                    <div className="space-y-1">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder={t("imageUrlPlaceholder")}
                        className="h-9 text-xs"
                      />
                      <p className="text-muted-foreground text-[10px]">{t("imageUrlHint")}</p>
                    </div>
                  ) : (
                    <AttachmentImageUploadView
                      value={uploadedFile}
                      onChange={handleUploadedFileChange}
                      shape="square"
                      hideHint
                      aria-label={t("imageSection")}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Giá bán & Giá gốc niêm yết */}
            <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-3.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="quick-add-show-price"
                  className="cursor-pointer text-xs font-semibold"
                >
                  {t("priceConfigTitle")}
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="quick-add-show-price"
                    checked={showPrice}
                    onCheckedChange={(checked) => setShowPrice(Boolean(checked))}
                  />
                  <Label
                    htmlFor="quick-add-show-price"
                    className="cursor-pointer text-xs font-medium"
                  >
                    {t("showPriceCheckbox")}
                  </Label>
                </div>
              </div>

              {showPrice ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-add-price" className="text-xs font-medium">
                      {t("priceLabel")}
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="quick-add-price"
                        inputMode="numeric"
                        value={price ? formatDisplayNumber(Number(price.replace(/\D/g, ""))) : ""}
                        onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("pricePlaceholder")}
                        className="h-9 pr-8 text-xs font-medium"
                      />
                      <span className="text-muted-foreground pointer-events-none absolute right-2.5 text-xs font-semibold">
                        {CURRENCY_SYMBOLS.VND}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quick-add-original-price" className="text-xs font-medium">
                      {t("originalPriceLabel")}
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="quick-add-original-price"
                        inputMode="numeric"
                        value={
                          originalPrice
                            ? formatDisplayNumber(Number(originalPrice.replace(/\D/g, "")))
                            : ""
                        }
                        onChange={(e) => setOriginalPrice(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("originalPricePlaceholder")}
                        className="h-9 pr-8 text-xs font-medium"
                      />
                      <span className="text-muted-foreground pointer-events-none absolute right-2.5 text-xs font-semibold">
                        {CURRENCY_SYMBOLS.VND}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">{t("priceDisabledHint")}</p>
              )}
            </div>

            {/* Danh mục & Nền tảng */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quick-add-cat" className="text-xs font-medium">
                  {t("categoryLabel")}
                </Label>
                <SelectField
                  id="quick-add-cat"
                  value={categoryId}
                  onValueChange={setCategoryId}
                  options={categoryOptions}
                  searchable={true}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-add-platform" className="text-xs font-medium">
                  {t("platformLabel")}
                </Label>
                <SelectField
                  id="quick-add-platform"
                  value={platform}
                  onValueChange={setPlatform}
                  options={platformOptions}
                  searchable={true}
                />
              </div>
            </div>

            {/* Nhãn nổi bật (Badge) - Chỉ chọn từ các nhãn hệ thống setup sẵn, không cho nhập tự do */}
            <div className="border-border bg-muted/20 space-y-3 rounded-xl border p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-semibold">{t("badgeLabel")}</Label>
                  <p className="text-muted-foreground text-[11px]">{t("badgeHint")}</p>
                </div>
                {badgeText.trim() ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[10px]">{t("preview")}</span>
                    <span
                      className="inline-flex h-6.5 shrink-0 items-center justify-center rounded-md px-2.5 text-[11px] font-bold shadow-2xs transition-all"
                      style={{
                        backgroundColor: badgeBgColor,
                        color: badgeTextColor,
                      }}
                    >
                      {badgeText.trim()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Danh sách các nút nhãn có sẵn */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={!badgeText.trim() ? "secondary" : "outline"}
                  onClick={() => setBadgeText("")}
                  className={cn(
                    "h-7 gap-1 rounded-full px-3 text-xs font-medium transition-all",
                    !badgeText.trim() && "border-primary/40 bg-muted font-semibold",
                  )}
                >
                  <Ban className="size-3" />
                  <span>{t("noBadge")}</span>
                </Button>

                {BADGE_PRESETS.map((preset) => {
                  const presetLabel = t(`badgePresets.${preset.key}`);
                  const isSelected = badgeText === presetLabel;
                  return (
                    <Button
                      key={preset.key}
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => {
                        if (isSelected) {
                          setBadgeText("");
                        } else {
                          setBadgeText(presetLabel);
                          if (!badgeText) {
                            setBadgeBgColor(preset.defaultBg);
                            setBadgeTextColor(preset.defaultText);
                          }
                        }
                      }}
                      className={cn(
                        "h-7 gap-1 rounded-full px-3 text-xs font-medium transition-all",
                        isSelected && "ring-primary font-bold ring-2 ring-offset-1",
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: badgeBgColor,
                              color: badgeTextColor,
                            }
                          : undefined
                      }
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                      <span>{presetLabel}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Tùy chỉnh màu sắc riêng cho Nhãn nổi bật (Màu nền & Màu chữ) */}
              {badgeText.trim() ? (
                <div className="border-border/60 space-y-3 border-t pt-3">
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground block text-[11px] font-medium">
                      {t("paletteFor", { badge: badgeText })}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BADGE_COLOR_PRESETS.map((p) => {
                        const isSelected =
                          badgeBgColor.toLowerCase() === p.bg.toLowerCase() &&
                          badgeTextColor.toLowerCase() === p.text.toLowerCase();

                        return (
                          <Button
                            key={p.key}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBadgeBgColor(p.bg);
                              setBadgeTextColor(p.text);
                            }}
                            className={cn(
                              "h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all",
                              isSelected
                                ? "ring-primary ring-2 ring-offset-1"
                                : "opacity-85 hover:opacity-100",
                            )}
                            style={{
                              backgroundColor: p.bg,
                              color: p.text,
                              borderColor: p.bg,
                            }}
                          >
                            <span>{t(`colorPresets.${p.key}`)}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">{t("badgeBgColor")}</Label>
                      <ColorInput
                        value={badgeBgColor}
                        defaultColor="#EF4444"
                        pickerLabel={t("pickBadgeBg")}
                        onChange={setBadgeBgColor}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">{t("badgeTextColor")}</Label>
                      <ColorInput
                        value={badgeTextColor}
                        defaultColor="#FFFFFF"
                        pickerLabel={t("pickBadgeText")}
                        onChange={setBadgeTextColor}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!title.trim()}
            onClick={handleConfirm}
            className="h-9 text-xs font-semibold"
          >
            {isEditing ? t("save") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
