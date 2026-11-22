"use client";

import Image from "next/image";
import { cn } from "cn";
import { Images, ImageUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";

import type { UploadedFile } from "./image-upload.types";

/**
 * Hiển thị ảnh đại diện/logo và chọn ảnh có sẵn trong Thư viện qua callback của module.
 * Upload file chỉ thực hiện ở trang Thư viện.
 *
 * @param props - Ảnh hiện tại, callback chọn/gỡ, hình dạng và trạng thái.
 * @returns Ô chọn ảnh.
 */
export function ImageUpload({
  value,
  onChange,
  shape = "circle",
  fallback,
  hint,
  disabled,
  onChoose,
  chooseLabel,
  "aria-label": ariaLabel,
}: {
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  shape?: "circle" | "square";
  /** Nội dung khi chưa có ảnh (chữ viết tắt tên…); mặc định icon ảnh. */
  fallback?: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  /** Bộ chọn ảnh ngoài component; common không biết module hoặc API thư viện. */
  onChoose?: () => void;
  chooseLabel?: string;
  "aria-label"?: string;
}) {
  const t = useTranslations("common.imageUpload");

  return (
    <div role="group" aria-label={ariaLabel} className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden border",
            shape === "circle" ? "rounded-full" : "rounded-2xl",
          )}
        >
          {value ? (
            <Image
              src={value.url}
              alt={value.alt || value.name || ""}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={value.url.startsWith("data:") || value.url.startsWith("blob:")}
            />
          ) : (
            (fallback ?? <ImageUp className="size-6" aria-hidden />)
          )}
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {onChoose ? (
            <Button type="button" variant="outline" disabled={disabled} onClick={onChoose}>
              <Images />
              {chooseLabel ?? t("choose")}
            </Button>
          ) : null}
          {value ? (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
              {t("remove")}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{hint ?? t("hint")}</p>
    </div>
  );
}

export type * from "./image-upload.types";
