"use client";

import Image from "next/image";
import { cn } from "cn";
import { FileText, ImageOff, Lock, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Attachment } from "../../types/attachment.types";
import { AttachmentVideoPlayer } from "./attachment-video-player";
import { useAttachmentPreview } from "./hooks/use-attachment-preview";

/** @param props - File, chế độ hiển thị chi tiết và class tùy biến. @returns Ảnh xem trước hoặc icon phù hợp. */
export function AttachmentPreview({
  file,
  contain = false,
  className,
}: {
  file: Attachment;
  contain?: boolean;
  className?: string;
}) {
  const t = useTranslations("system.attachment");
  const state = useAttachmentPreview();
  return (
    <div
      className={cn(
        "bg-muted/30 text-muted-foreground relative flex w-full items-center justify-center overflow-hidden",
        contain ? "size-full rounded-xl" : "size-full",
        className,
      )}
    >
      {file.contentType.startsWith("image/") && !state.failed ? (
        <Image
          src={file.url}
          alt={file.altText || file.originalName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
          onError={state.onError}
          className={cn(
            "transition-transform duration-200",
            contain ? "object-contain" : "object-cover group-hover:scale-105",
          )}
          // Ảnh riêng tư đi qua API có kiểm quyền: trình duyệt tải trực tiếp, không để Next lưu bản tối ưu công khai.
          unoptimized={
            file.visibility === "private" ||
            file.url.startsWith("data:") ||
            file.url.startsWith("blob:")
          }
        />
      ) : file.contentType.startsWith("video/") && !state.failed ? (
        contain ? (
          <AttachmentVideoPlayer
            src={file.url}
            title={file.originalName}
            onError={state.onError}
            className="size-full"
          />
        ) : (
          <Video className="size-10" aria-hidden />
        )
      ) : state.failed ? (
        <ImageOff className="size-10" aria-label={t("imageUnavailable")} />
      ) : (
        <FileText className="size-10" aria-hidden />
      )}
      {file.visibility === "private" ? (
        <span
          className="bg-background/90 text-foreground absolute bottom-1.5 left-1.5 z-10 inline-flex size-6 items-center justify-center rounded-md border shadow-2xs"
          title={t("privateBadge")}
        >
          <Lock className="size-3.5" aria-label={t("privateBadge")} />
        </span>
      ) : null}
    </div>
  );
}
