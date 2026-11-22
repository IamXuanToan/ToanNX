"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { ImageUpload } from "@/shares/components/common/image-upload";
import type { FolderCapabilities } from "../types/attachment-folder.types";

import { useAttachmentImageUpload } from "./hooks/use-attachment-image-upload";
import { AttachmentPicker } from "./attachment-picker";

/**
 * Ô ảnh của form: chỉ chọn ảnh đã có trong Thư viện (avatar, logo…).
 *
 * @param props - Props của `ImageUpload` và quyền truy cập Thư viện.
 * @returns Ô chọn ảnh từ Thư viện.
 */
export function AttachmentImageUpload({
  canRead,
  canUpload,
  folders,
  ...props
}: Omit<ComponentProps<typeof ImageUpload>, "onChoose" | "chooseLabel"> & {
  canRead: boolean;
  canUpload: boolean;
  folders?: FolderCapabilities;
}) {
  const t = useTranslations("system.attachment");
  const upload = useAttachmentImageUpload(props.onChange);
  return (
    <>
      <ImageUpload
        {...props}
        onChoose={canRead ? upload.openLibrary : undefined}
        chooseLabel={t("chooseImage")}
      />
      {upload.libraryOpen ? (
        <AttachmentPicker
          canUpload={canUpload}
          folders={folders}
          canDelete={folders?.canDeleteFiles}
          onSelect={upload.select}
          onClose={upload.closeLibrary}
        />
      ) : null}
    </>
  );
}
