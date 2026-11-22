"use client";

import { useTranslations } from "next-intl";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { attachmentKeys } from "../constants/query-keys";
import { attachmentService } from "../services/attachment.service";
import type { Attachment, AttachmentVisibility } from "../types/attachment.types";

/** @returns Mutation chuyển file giữa công khai và riêng tư (backend chuyển kho, giữ id). */
export function useSetAttachmentVisibility() {
  const t = useTranslations("system.attachment");
  return useResourceMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: string;
      visibility: AttachmentVisibility;
    }): Promise<Attachment> => attachmentService.setVisibility(id, visibility),
    invalidate: [attachmentKeys.all],
    success: (updated: Attachment) =>
      t(updated.visibility === "private" ? "madePrivate" : "madePublic"),
  });
}
