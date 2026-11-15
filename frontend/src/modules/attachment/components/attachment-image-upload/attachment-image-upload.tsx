"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { ImageUpload } from "@/shares/components/common/image-upload/image-upload";
import type { FolderCapabilities } from "../../types/attachment.types";

import { useAttachmentImageUpload } from "./hooks/use-attachment-image-upload";
import { AttachmentPicker } from "../attachment-picker/attachment-picker";

/**
 * `ImageUpload` chung nối với API Attachment (ảnh đại diện, logo…).
 *
 * @param props - Props của `ImageUpload` trừ phần upload.
 * @returns Ô chọn ảnh lưu vào Attachment.
 */
export function AttachmentImageUpload({
  canRead,
  canUpload,
  folders,
  ...props
}: Omit<
  ComponentProps<typeof ImageUpload>,
  "onUpload" | "formatError" | "onChoose" | "chooseLabel" | "canUpload"
> & { canRead: boolean; canUpload: boolean; folders?: FolderCapabilities }) {
  const t = useTranslations("attachment");
  const upload = useAttachmentImageUpload(props.onChange);
  return (
    <>
      <ImageUpload
        {...props}
        canUpload={canUpload}
        onChoose={canRead ? upload.openLibrary : undefined}
        chooseLabel={t("chooseImage")}
        onUpload={upload.upload}
        formatError={upload.formatError}
      />
      {upload.libraryOpen ? (
        <AttachmentPicker
          canRead={canRead}
          canUpload={canUpload}
          folders={folders}
          onSelect={upload.select}
          onClose={upload.closeLibrary}
        />
      ) : null}
    </>
  );
}
