"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdatePageFeedback } from "../../../hooks/use-update-page-feedback";
import {
  pageFeedbackUpdateFormSchema,
  type PageFeedbackUpdateFormValues,
} from "../../../schemas/page-feedback.schema";
import type { PageFeedbackDetail } from "../../../types/page-feedback.types";

/**
 * State form xử lý chi tiết góp ý (cập nhật trạng thái, ghi chú xử lý và mở hộp thoại cảm ơn).
 *
 * @param options - Chi tiết góp ý hiện tại và callback sau khi lưu.
 * @returns Form RHF, state hộp thoại cảm ơn và handler lưu.
 */
export function usePageFeedbackDetailForm({
  feedback,
  onSuccess,
}: {
  feedback: PageFeedbackDetail;
  onSuccess?: () => void;
}) {
  const t = useTranslations("utilities.feedbacks");
  const [thankOpen, setThankOpen] = useState(false);
  const updateMutation = useUpdatePageFeedback();

  const form = useForm<PageFeedbackUpdateFormValues>({
    resolver: zodResolver(pageFeedbackUpdateFormSchema),
    defaultValues: {
      status: feedback.status,
      resolutionNote: feedback.resolutionNote ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      status: feedback.status,
      resolutionNote: feedback.resolutionNote ?? "",
    });
  }, [feedback.resolutionNote, feedback.status, form]);

  const submit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      id: feedback.id,
      input: {
        status: values.status,
        resolutionNote: values.resolutionNote ?? "",
      },
    });
    toast.success(t("updated"));
    onSuccess?.();
  });

  return {
    form,
    submit,
    isPending: updateMutation.isPending,
    thankOpen,
    setThankOpen,
  };
}
