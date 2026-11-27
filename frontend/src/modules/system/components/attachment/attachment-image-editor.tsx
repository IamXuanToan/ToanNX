"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import {
  Check,
  Circle,
  Crop,
  Loader2,
  Maximize2,
  RotateCw,
  Square,
  Stamp,
  X,
  ZoomIn,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { ColorInput } from "@/shares/components/common/color-input";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Slider } from "@/shares/components/ui/slider";
import { Switch } from "@/shares/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { cn } from "cn";

import {
  CROP_ASPECT_RATIOS,
  CROP_ZOOM_STEP,
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  WATERMARK_COLOR_PRESETS,
  WATERMARK_FONT_MAX,
  WATERMARK_FONT_MIN,
  WATERMARK_FONT_SCALE,
  WATERMARK_FONT_STEP,
  WATERMARK_MIN_PREVIEW_PX,
  WATERMARK_OPACITY_MAX,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_STEP,
  WATERMARK_POSITIONS,
} from "../../constants/image-editor";
import type { Attachment } from "../../types/attachment.types";
import { watermarkShadowColor } from "../../lib/watermark-shadow";
import { useAttachmentImageEditor } from "./hooks/use-attachment-image-editor";

/** Thuộc tính của component `AttachmentImageEditor`. */
export type AttachmentImageEditorProps = {
  /** Tệp ảnh cần chỉnh sửa. */
  file: Attachment;
  /** Callback khi lưu tệp ảnh mới thành công. */
  onSaved: (newAttachment: Attachment) => void;
  /** Callback khi bấm hủy chỉnh sửa. */
  onCancel: () => void;
};

/**
 * Bộ công cụ chỉnh sửa hình ảnh trực quan: cắt ảnh theo tỉ lệ tự do, vuông, tròn; thu phóng; xoay và chèn watermark bản quyền.
 *
 * @param props - Thuộc tính `AttachmentImageEditorProps`.
 * @returns Giao diện chỉnh sửa ảnh thời gian thực chất lượng cao.
 */
export function AttachmentImageEditor({ file, onSaved, onCancel }: AttachmentImageEditorProps) {
  const t = useTranslations("system.attachment");
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropAreaEl, setCropAreaEl] = useState<HTMLElement | null>(null);

  const {
    crop,
    zoom,
    setZoom,
    isOriginal,
    cropperAspect,
    onMediaLoaded,
    onCropChange,
    onZoomChange,
    rotation,
    selectedRatioId,
    aspect,
    cropShape,
    cropSize,
    setCropSize,
    watermark,
    setWatermark,
    activeTab,
    setActiveTab,
    isSaving,
    errorMessage,
    onCropComplete,
    handleRatioChange,
    handleRotate,
    handleSave,
    handleCancel,
  } = useAttachmentImageEditor({ file, onSaved, onCancel });

  useEffect(() => {
    const updateCropArea = () => {
      if (containerRef.current) {
        const el = containerRef.current.querySelector<HTMLElement>(".attachment-crop-area");
        if (el && el !== cropAreaEl) {
          setCropAreaEl(el);
        }
      }
    };
    updateCropArea();
    const timer = setTimeout(updateCropArea, 100);
    return () => clearTimeout(timer);
  }, [cropAreaEl, selectedRatioId, aspect, cropShape, cropSize]);

  const handleResizeStart = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = cropAreaEl?.getBoundingClientRect();
    const startW = rect?.width ?? cropSize?.width ?? 280;
    const startH = rect?.height ?? cropSize?.height ?? 280;
    const containerRect = containerRef.current?.getBoundingClientRect();
    const maxW = (containerRect?.width ?? 600) - 24;
    const maxH = (containerRect?.height ?? 600) - 24;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;

      let nextW = startW;
      let nextH = startH;

      if (dir.includes("e")) nextW = startW + deltaX * 2;
      if (dir.includes("w")) nextW = startW - deltaX * 2;
      if (dir.includes("s")) nextH = startH + deltaY * 2;
      if (dir.includes("n")) nextH = startH - deltaY * 2;

      nextW = Math.max(80, Math.min(maxW, Math.round(nextW)));
      nextH = Math.max(80, Math.min(maxH, Math.round(nextH)));

      setCropSize({ width: nextW, height: nextH });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Xem trước nằm trong khung cắt; ảnh xuất rộng bằng vùng cắt → cùng tỉ lệ chữ/chiều rộng như ảnh lưu ra.
  const previewFontPx = Math.max(
    WATERMARK_MIN_PREVIEW_PX,
    ((cropAreaEl?.getBoundingClientRect().width ?? 0) * watermark.fontSize) / WATERMARK_FONT_SCALE,
  );
  const watermarkPreview =
    watermark.enabled && watermark.text.trim() ? (
      <div
        className={cn(
          "pointer-events-none absolute z-30 p-2.5 leading-none font-bold tracking-wide drop-shadow-md select-none",
          watermark.position === "bottom-right" && "right-2 bottom-2 text-right",
          watermark.position === "bottom-left" && "bottom-2 left-2 text-left",
          watermark.position === "top-right" && "top-2 right-2 text-right",
          watermark.position === "top-left" && "top-2 left-2 text-left",
          watermark.position === "center" &&
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center",
        )}
        style={{
          opacity: watermark.opacity / 100,
          fontSize: previewFontPx,
          color: watermark.color,
          textShadow: `1px 1px ${Math.round(previewFontPx * 0.25)}px ${watermarkShadowColor(watermark.color)}`,
        }}
      >
        {watermark.text}
      </div>
    ) : null;

  return (
    <div className="flex size-full flex-col overflow-hidden bg-black/95 text-white">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "crop" | "watermark")}
        className="flex size-full flex-col overflow-hidden"
      >
        {/* Header thanh công cụ trên cùng */}
        <div className="flex h-13 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Crop className="size-4 text-emerald-400" />
            <span className="text-sm font-semibold tracking-tight">{t("imageEditorTitle")}</span>
            <span className="max-w-[200px] truncate text-xs text-white/50 sm:max-w-[320px]">
              {file.originalName}
            </span>
          </div>

          {/* Tab chuyển đổi Cắt ảnh / Đóng dấu theo chuẩn shadcn/ui Tabs */}
          <TabsList className="h-8 bg-white/10 p-0.5 text-white/70">
            <TabsTrigger
              value="crop"
              className="data-active:bg-primary data-active:text-primary-foreground gap-1.5 text-xs text-white/70"
            >
              <Crop className="size-3.5" />
              <span>{t("crop")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="watermark"
              className="data-active:bg-primary data-active:text-primary-foreground gap-1.5 text-xs text-white/70"
            >
              <Stamp className="size-3.5" />
              <span>{t("watermark")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Thân chính: Bên trái là Khung Cropper, Bên phải là Bảng điều khiển */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
          {/* Khung cắt ảnh thời gian thực */}
          <div
            ref={containerRef}
            className="relative flex size-full items-center justify-center overflow-hidden bg-zinc-950 md:col-span-8"
          >
            <Cropper
              image={file.url}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={cropperAspect}
              cropShape={cropShape}
              cropSize={selectedRatioId === "free" ? cropSize : undefined}
              showGrid
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onMediaLoaded={onMediaLoaded}
              onCropComplete={onCropComplete}
              classes={{
                containerClassName: "size-full",
                cropAreaClassName:
                  "attachment-crop-area border-2 border-primary/90 shadow-2xl relative !overflow-visible",
              }}
            />

            {/* Watermark preview: portal vào đúng bên trong khung cắt ảnh */}
            {cropAreaEl && watermarkPreview
              ? createPortal(watermarkPreview, cropAreaEl)
              : watermarkPreview}

            {/* 8 tay nắm kéo thả resize khi ở chế độ Tự do: portal vào đúng viền khung cắt */}
            {cropAreaEl && selectedRatioId === "free"
              ? createPortal(
                  <div className="pointer-events-none absolute inset-0 z-40">
                    {(
                      [
                        [
                          "nw",
                          "top-0 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-xs border-2 shadow-md hover:scale-125",
                          "cropHandleNw",
                        ],
                        [
                          "ne",
                          "top-0 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-xs border-2 shadow-md hover:scale-125",
                          "cropHandleNe",
                        ],
                        [
                          "sw",
                          "bottom-0 left-0 size-3.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-xs border-2 shadow-md hover:scale-125",
                          "cropHandleSw",
                        ],
                        [
                          "se",
                          "right-0 bottom-0 size-3.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-xs border-2 shadow-md hover:scale-125",
                          "cropHandleSe",
                        ],
                        [
                          "n",
                          "top-0 left-1/2 h-2.5 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-xs border shadow-sm hover:scale-110",
                          "cropHandleN",
                        ],
                        [
                          "s",
                          "bottom-0 left-1/2 h-2.5 w-6 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-xs border shadow-sm hover:scale-110",
                          "cropHandleS",
                        ],
                        [
                          "w",
                          "top-1/2 left-0 h-6 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-xs border shadow-sm hover:scale-110",
                          "cropHandleW",
                        ],
                        [
                          "e",
                          "top-1/2 right-0 h-6 w-2.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-xs border shadow-sm hover:scale-110",
                          "cropHandleE",
                        ],
                      ] as const
                    ).map(([dir, posClass, labelKey]) => (
                      <AppTooltip key={dir} content={t(labelKey)}>
                        <div
                          onPointerDown={(e) => handleResizeStart(e, dir)}
                          aria-label={t(labelKey)}
                          className={`border-primary pointer-events-auto absolute touch-none bg-white ${posClass}`}
                        />
                      </AppTooltip>
                    ))}
                  </div>,
                  cropAreaEl,
                )
              : null}
          </div>

          {/* Bảng điều khiển công cụ bên phải */}
          <div className="flex flex-col justify-between overflow-y-auto border-t border-white/10 bg-zinc-900/90 p-4 sm:p-5 md:col-span-4 md:border-t-0 md:border-l">
            <div className="space-y-5">
              {/* TAB 1: CÔNG CỤ CẮT ẢNH */}
              <TabsContent value="crop" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-white/80 uppercase">
                    {t("cropShape")}
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3">
                    {CROP_ASPECT_RATIOS.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        variant={selectedRatioId === item.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRatioChange(item.id)}
                        className={cn(
                          "h-auto flex-col gap-1 rounded-xl p-2 text-xs font-medium transition-all",
                          selectedRatioId === item.id
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        {item.id === "round" ? (
                          <Circle className="size-4" />
                        ) : item.id === "square" ? (
                          <Square className="size-4" />
                        ) : (
                          <Maximize2 className="size-4" />
                        )}
                        <span>{t(item.labelKey)}</span>
                      </Button>
                    ))}
                  </div>

                  {selectedRatioId === "free" && cropSize ? (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                      <span>
                        {cropSize.width} × {cropSize.height} px
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCropSize(undefined)}
                        className="text-primary h-auto p-0 text-xs font-medium hover:bg-transparent hover:underline"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Thanh trượt Thu phóng (ẩn ở "Ảnh gốc": khung luôn phủ trọn ảnh) */}
                <div className={isOriginal ? "hidden" : "space-y-2 pt-2"}>
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="size-3.5" />
                      {t("zoom")}
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={[zoom]}
                    min={MIN_CROP_ZOOM}
                    max={MAX_CROP_ZOOM}
                    step={CROP_ZOOM_STEP}
                    onValueChange={([val]) => val !== undefined && setZoom(val)}
                    aria-label={t("zoom")}
                    className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary cursor-pointer [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/20"
                  />
                </div>

                {/* Nút xoay 90 độ */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRotate}
                    className="h-9 w-full gap-2 rounded-xl border-white/20 bg-white/5 text-xs text-white hover:bg-white/10"
                  >
                    <RotateCw className="size-3.5" />
                    <span>
                      {t("rotate90")} ({rotation}°)
                    </span>
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: ĐÓNG DẤU WATERMARK */}
              <TabsContent value="watermark" className="mt-0 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-white">
                      {t("watermarkEnable")}
                    </Label>
                    <p className="text-[11px] text-white/60">{t("watermarkHint")}</p>
                  </div>
                  <Switch
                    checked={watermark.enabled}
                    onCheckedChange={(checked) =>
                      setWatermark((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                {watermark.enabled && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="wm-text" className="text-xs font-medium text-white/80">
                        {t("watermarkText")}
                      </Label>
                      <Input
                        id="wm-text"
                        value={watermark.text}
                        onChange={(e) =>
                          setWatermark((prev) => ({ ...prev, text: e.target.value }))
                        }
                        placeholder={t("watermarkPlaceholder")}
                        maxLength={50}
                        className="h-10 rounded-xl border-white/20 bg-white/10 text-xs text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* Vị trí đóng dấu */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-white/80">
                        {t("watermarkPosition")}
                      </Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {WATERMARK_POSITIONS.map((pos) => (
                          <Button
                            key={pos.id}
                            type="button"
                            variant={watermark.position === pos.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setWatermark((prev) => ({ ...prev, position: pos.id }))}
                            className={cn(
                              "h-8 rounded-lg text-xs font-medium transition-colors",
                              watermark.position === pos.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            {t(pos.labelKey)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Độ mờ (Opacity) dùng chuẩn shadcn/ui Slider */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>{t("watermarkOpacity")}</span>
                        <span className="font-semibold text-white tabular-nums">
                          {watermark.opacity}%
                        </span>
                      </div>
                      <Slider
                        value={[watermark.opacity]}
                        min={WATERMARK_OPACITY_MIN}
                        max={WATERMARK_OPACITY_MAX}
                        step={WATERMARK_OPACITY_STEP}
                        onValueChange={([val]) =>
                          val !== undefined && setWatermark((prev) => ({ ...prev, opacity: val }))
                        }
                        aria-label={t("watermarkOpacity")}
                        className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary cursor-pointer [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/20"
                      />
                    </div>

                    {/* Cỡ chữ: theo % chiều rộng ảnh (ảnh to hay nhỏ chữ đều cân đối) */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>{t("watermarkFontSize")}</span>
                        <span className="font-semibold text-white tabular-nums">
                          {t("watermarkFontSizeValue", {
                            percent: ((watermark.fontSize / WATERMARK_FONT_SCALE) * 100).toFixed(1),
                          })}
                        </span>
                      </div>
                      <Slider
                        value={[watermark.fontSize]}
                        min={WATERMARK_FONT_MIN}
                        max={WATERMARK_FONT_MAX}
                        step={WATERMARK_FONT_STEP}
                        onValueChange={([val]) =>
                          val !== undefined && setWatermark((prev) => ({ ...prev, fontSize: val }))
                        }
                        aria-label={t("watermarkFontSize")}
                        className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary cursor-pointer [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/20"
                      />
                    </div>

                    {/* Màu chữ watermark: chọn nhanh Trắng/Đen hoặc mã màu bất kỳ */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs text-white/80">{t("watermarkColor")}</span>
                      <div className="flex items-center gap-2">
                        {WATERMARK_COLOR_PRESETS.map((preset) => (
                          <AppTooltip key={preset.value} content={t(preset.labelKey)}>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setWatermark((prev) => ({ ...prev, color: preset.value }))
                              }
                              style={{ backgroundColor: preset.value }}
                              className={cn(
                                "size-10 shrink-0 rounded-full border border-white/40 p-0 transition-transform",
                                watermark.color.toUpperCase() === preset.value &&
                                  "ring-primary ring-2 ring-offset-2 ring-offset-zinc-900",
                              )}
                              aria-label={t(preset.labelKey)}
                            />
                          </AppTooltip>
                        ))}
                        <div className="min-w-0 flex-1">
                          <ColorInput
                            value={watermark.color}
                            defaultColor={watermark.color}
                            pickerLabel={t("watermarkColorPicker")}
                            inputClassName="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                            onChange={(value) =>
                              setWatermark((prev) => ({ ...prev, color: value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>

            {errorMessage ? (
              <p className="bg-destructive/20 text-destructive rounded-lg p-2 text-xs">
                {errorMessage}
              </p>
            ) : null}

            {/* Nút hành động Lưu / Hủy */}
            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-9 rounded-xl border-white/20 bg-white/5 text-xs text-white hover:bg-white/10"
              >
                <X className="mr-1.5 size-3.5" />
                <span>{t("cancel")}</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-md"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{isSaving ? t("saving") : t("saveAsNew")}</span>
              </Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
