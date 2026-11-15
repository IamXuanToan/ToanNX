"use client";

import { cn } from "cn";
import { Images, ImageUp, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";

import { Button } from "@/shares/components/ui/button";

import type { UploadedFile } from "../file-upload-field/types";
import { useImageUpload } from "./hooks/use-image-upload";

/**
 * Chọn một ảnh (ảnh đại diện, logo…) có xem trước: khung ảnh tròn hoặc vuông, nút "Tải ảnh lên" /
 * "Đổi ảnh" và "Gỡ ảnh", câu gợi ý định dạng, lỗi dưới khung. Không biết API: module truyền
 * `onUpload` (module Attachment có adapter sẵn).
 *
 * @param props - Ảnh hiện tại, callback upload/đổi, hình dạng và trạng thái.
 * @returns Ô chọn ảnh.
 */
export function ImageUpload({
  value,
  onChange,
  onUpload,
  formatError,
  shape = "circle",
  fallback,
  hint,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  disabled,
  onChoose,
  chooseLabel,
  canUpload = true,
  "aria-label": ariaLabel,
}: {
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  onUpload: (file: File) => Promise<UploadedFile>;
  formatError: (error: unknown) => string;
  shape?: "circle" | "square";
  /** Nội dung khi chưa có ảnh (chữ viết tắt tên…); mặc định icon ảnh. */
  fallback?: React.ReactNode;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  /** Bộ chọn ảnh ngoài component; common không biết module hoặc API thư viện. */
  onChoose?: () => void;
  chooseLabel?: string;
  canUpload?: boolean;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.imageUpload");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const state = useImageUpload({ onUpload, onChange, formatError });
  const locked = disabled || state.pending;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden border",
            shape === "circle" ? "rounded-full" : "rounded-2xl",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh do backend phục vụ, không qua next/image
            <img src={value.url} alt="" className="size-full object-cover" />
          ) : (
            (fallback ?? <ImageUp className="size-6" aria-hidden />)
          )}
          {state.pending ? (
            <span className="bg-card/70 absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={locked || !canUpload}
            aria-label={ariaLabel ?? t("upload")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void state.upload(file);
            }}
          />
          {onChoose ? (
            <Button type="button" variant="outline" disabled={locked} onClick={onChoose}>
              <Images />
              {chooseLabel ?? t("choose")}
            </Button>
          ) : null}
          {canUpload ? (
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={() => inputRef.current?.click()}
            >
              <ImageUp />
              {value ? t("change") : t("upload")}
            </Button>
          ) : null}
          {value ? (
            <Button
              type="button"
              variant="ghost"
              disabled={locked}
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
              {t("remove")}
            </Button>
          ) : null}
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">{hint ?? t("hint")}</p>
      )}
    </div>
  );
}
