"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentUploadInput } from "../types/attachment.types";

/** @returns Mutation upload file (nơi gọi tự báo kết quả và lỗi). */
export function useUploadAttachment() {
  return useResourceMutation({
    mutationFn: (input: File | AttachmentUploadInput) =>
      attachmentService.upload(input instanceof File ? { file: input } : input),
    invalidate: [attachmentKeys.all],
    success: false,
    toastError: false,
  });
}
