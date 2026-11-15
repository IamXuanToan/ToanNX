"use client";

import { useState } from "react";

import type { UploadedFile } from "@/shares/components/common/file-upload-field/types";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useUploadAttachment } from "../../../hooks/use-upload-attachment";
import type { Attachment } from "../../../types/attachment.types";

/** @returns Hàm upload ảnh lên Attachment (trả về dạng file của common) và định dạng lỗi API. */
export function useAttachmentImageUpload(onChange: (file: UploadedFile | null) => void) {
  const mutation = useUploadAttachment();
  const [libraryOpen, setLibraryOpen] = useState(false);
  return {
    libraryOpen,
    openLibrary: () => setLibraryOpen(true),
    closeLibrary: () => setLibraryOpen(false),
    select: (file: Attachment) => {
      onChange({
        id: file.id,
        url: file.url,
        name: file.originalName,
        size: file.size,
        contentType: file.contentType,
      });
      setLibraryOpen(false);
    },
    formatError: useApiErrorMessage(),
    upload: async (file: File): Promise<UploadedFile> => {
      const attachment = await mutation.mutateAsync(file);
      return {
        id: attachment.id,
        url: attachment.url,
        name: attachment.originalName,
        size: attachment.size,
        contentType: attachment.contentType,
      };
    },
  };
}
