"use client";

import { generateHTML, generateJSON } from "@tiptap/core";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useEmailTemplates } from "@/modules/system/hooks/use-email-templates";
import { emailTemplateService } from "@/modules/system/services/email-template.service";
import { createEditorBaseExtensions } from "@/shares/components/common/tiptap-editor-extensions";
import type { TiptapDocument } from "@/shares/components/common/tiptap-editor.types";

import { useThankPageFeedback } from "../../../hooks/use-thank-page-feedback";
import type { PageFeedback, PageFeedbackDetail } from "../../../types/page-feedback.types";

const EMPTY_DOC: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/**
 * State hộp thoại gửi email cảm ơn:
 * - Tải danh sách mẫu email `FEEDBACK_THANKS` đang `ACTIVE`.
 * - Khi mở hoặc đổi mẫu, tự gọi `preview` trộn dữ liệu thật của góp ý để hiển thị ngay tiêu đề + nội dung.
 * - Cho phép người dùng chỉnh sửa trực tiếp tiêu đề và nội dung bằng `TiptapEditor` trước khi gửi.
 *
 * @param options - Bản ghi góp ý, trạng thái mở dialog và callback đóng/thành công.
 * @returns Danh sách mẫu, nội dung Tiptap, tiêu đề và handler gửi email cảm ơn.
 */
export function useFeedbackThankDialog({
  feedback,
  open,
  onOpenChange,
}: {
  feedback: PageFeedback | PageFeedbackDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("utilities.feedbacks");
  const locale = useLocale();
  const templatesQuery = useEmailTemplates(
    { category: ["FEEDBACK_THANKS"], status: ["ACTIVE"], pageSize: 50 },
    open,
  );
  const thankMutation = useThankPageFeedback();
  const extensions = useMemo(() => createEditorBaseExtensions(), []);

  const templates = useMemo(() => templatesQuery.data?.items ?? [], [templatesQuery.data?.items]);

  const [templateId, setTemplateId] = useState<string>("auto");
  const [subject, setSubject] = useState("");
  const [doc, setDoc] = useState<TiptapDocument>(EMPTY_DOC);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string>("");

  const resolvedTemplate = useMemo(() => {
    if (templates.length === 0) return null;
    if (templateId !== "auto") {
      return templates.find((tpl) => tpl.id === templateId) ?? templates[0];
    }
    return (
      templates.find((tpl) => tpl.scope === "PERSONAL" && tpl.locale === locale) ??
      templates.find((tpl) => tpl.scope === "PERSONAL") ??
      templates.find((tpl) => tpl.scope === "SYSTEM" && tpl.locale === locale) ??
      templates[0]
    );
  }, [locale, templateId, templates]);

  const loadTemplatePreview = async (tplId: string) => {
    if (!feedback) return;
    setIsLoadingPreview(true);
    try {
      const resolutionNote =
        "resolutionNote" in feedback && feedback.resolutionNote
          ? feedback.resolutionNote
          : t("thankDialog.defaultResolutionNote");
      const sampleData = {
        sender_name: feedback.senderName || t("anonymousSender"),
        target_title: feedback.targetTitle || feedback.targetUrl,
        target_url: feedback.targetUrl,
        feedback_type: t(`types.${feedback.feedbackType}`),
        resolution_note: resolutionNote,
        owner_name: feedback.targetOwner?.fullName || feedback.targetOwner?.username || "",
      };
      const rendered = await emailTemplateService.preview(tplId, sampleData);
      setSubject(rendered.subject);
      try {
        setDoc(generateJSON(rendered.htmlBody || "<p></p>", extensions) as TiptapDocument);
      } catch {
        setDoc(EMPTY_DOC);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Tự nạp nội dung mẫu lần đầu khi mở dialog và đã có danh sách mẫu
  const targetTemplate = resolvedTemplate;
  const currentKey =
    open && feedback && targetTemplate ? `${feedback.id}:${targetTemplate.id}` : "";
  if (currentKey && currentKey !== loadedKey && !isLoadingPreview && targetTemplate) {
    setLoadedKey(currentKey);
    void loadTemplatePreview(targetTemplate.id);
  }

  const handleTemplateChange = (nextId: string) => {
    setTemplateId(nextId);
    const target =
      nextId === "auto"
        ? (templates.find((tpl) => tpl.scope === "PERSONAL") ??
          templates.find((tpl) => tpl.scope === "SYSTEM" && tpl.locale === locale) ??
          templates[0])
        : templates.find((tpl) => tpl.id === nextId);
    if (target && feedback) {
      setLoadedKey(`${feedback.id}:${target.id}`);
      void loadTemplatePreview(target.id);
    }
  };

  const send = async () => {
    if (!feedback) return;
    let htmlBody = "";
    try {
      htmlBody = generateHTML(doc, extensions);
    } catch {
      htmlBody = "";
    }
    await thankMutation.mutateAsync({
      id: feedback.id,
      input: {
        templateId: resolvedTemplate?.id,
        subject: subject.trim() || undefined,
        htmlBody: htmlBody.trim() || undefined,
      },
    });
    toast.success(t("thankDialog.sentToast"));
    setLoadedKey("");
    onOpenChange(false);
  };

  return {
    templates,
    isLoadingTemplates: templatesQuery.isLoading,
    isLoadingPreview,
    templateId,
    setTemplateId: handleTemplateChange,
    subject,
    setSubject,
    doc,
    setDoc,
    send,
    isPending: thankMutation.isPending,
  };
}
