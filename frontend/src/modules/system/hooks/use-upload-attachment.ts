"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentUploadInput } from "../types/attachment.types";

/** @returns Mutation upload file (nơi gọi tự báo kết quả và lỗi). */
export function useUploadAttachment() {
  return useResourceMutation({
    mutationFn: (input: File | AttachmentUploadInput) =>
      input instanceof File
        ? attachmentService.upload(input)
        : attachmentService.upload(input.file, input.folderId),
    invalidate: [attachmentKeys.all],
    success: false,
    toastError: false,
  });
}
