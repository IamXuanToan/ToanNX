"use client";

import { cn } from "cn";
import { FileText, ImageOff, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Attachment } from "../../types/attachment.types";
import { useAttachmentPreview } from "./hooks/use-attachment-preview";

/** @param props - File và chế độ hiển thị chi tiết. @returns Ảnh xem trước hoặc icon phù hợp. */
export function AttachmentPreview({
  file,
  contain = false,
}: {
  file: Attachment;
  contain?: boolean;
}) {
  const t = useTranslations("attachment");
  const state = useAttachmentPreview();
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex w-full items-center justify-center overflow-hidden rounded-lg",
        contain ? "mx-auto h-40 max-w-48" : "h-28",
      )}
    >
      {file.contentType.startsWith("image/") && !state.failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL tuyệt đối từ storage, không qua bộ tối ưu ảnh.
        <img
          src={file.url}
          alt={file.originalName}
          loading="lazy"
          onError={state.onError}
          className={cn("size-full", contain ? "object-contain" : "object-cover")}
        />
      ) : file.contentType.startsWith("video/") && !state.failed ? (
        contain ? (
          <video
            controls
            preload="metadata"
            src={file.url}
            aria-label={file.originalName}
            onError={state.onError}
            className="size-full object-contain"
          />
        ) : (
          <Video className="size-10" aria-hidden />
        )
      ) : state.failed ? (
        <ImageOff className="size-10" aria-label={t("imageUnavailable")} />
      ) : (
        <FileText className="size-10" aria-hidden />
      )}
    </div>
  );
}
