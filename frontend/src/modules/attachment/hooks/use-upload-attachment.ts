"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { AttachmentUploadInput } from "../types/attachment.types";
/** Mutation upload file, quyền và validation vẫn do backend Attachment xử lý. */
export function useUploadAttachment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: File | AttachmentUploadInput) =>
      input instanceof File
        ? attachmentService.upload(input)
        : attachmentService.upload(input.file, input.folderId),
    onSuccess: () => client.invalidateQueries({ queryKey: attachmentKeys.all }),
  });
}
