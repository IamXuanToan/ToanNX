"use client";

import { useState } from "react";

import type { UploadedFile } from "@/shares/components/common/image-upload/types";

import type { Attachment } from "../../../types/attachment.types";

/** @returns Trạng thái mở Thư viện và callback chọn ảnh có sẵn. */
export function useAttachmentImageUpload(onChange: (file: UploadedFile | null) => void) {
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
  };
}
