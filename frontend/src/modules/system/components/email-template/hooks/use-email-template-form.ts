"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { generateHTML } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { createEditorBaseExtensions } from "@/shares/components/common/tiptap-editor-extensions";
import type { TiptapDocument } from "@/shares/components/common/tiptap-editor.types";

import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useCreateEmailTemplate } from "../../../hooks/use-create-email-template";
import { usePreviewEmailTemplate } from "../../../hooks/use-preview-email-template";
import { useSupportedLanguages } from "../../../hooks/use-supported-languages";
import { useUpdateEmailTemplate } from "../../../hooks/use-update-email-template";
import {
  emailTemplateFormSchema,
  type EmailTemplateFormValues,
} from "../../../schemas/email-template.schema";
import type {
  EmailTemplateDetail,
  EmailTemplatePreviewResult,
  EmailTemplateTranslationItem,
} from "../../../types/email-template.types";
import { MergeFieldNode } from "../merge-field-node";

type RouteContext = "admin" | "portal";

type TranslationDraft = {
  name: string;
  subject: string;
  content: TiptapDocument;
};

const DEFAULT_DOC: TiptapDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function buildInitialTranslations(
  initial: EmailTemplateDetail | null | undefined,
  langCodes: string[],
): Record<string, TranslationDraft> {
  const map: Record<string, TranslationDraft> = {};
  const existing = initial?.translations ?? {};
  for (const code of langCodes) {
    const entry = existing[code];
    if (entry) {
      map[code] = {
        name: entry.name || initial?.name || "",
        subject: entry.subject || "",
        content:
          entry.content && Object.keys(entry.content).length > 0
            ? (entry.content as TiptapDocument)
            : DEFAULT_DOC,
      };
    } else if (initial && code === (initial.locale || "vi")) {
      map[code] = {
        name: initial.name || "",
        subject: initial.subject || "",
        content:
          initial.content && Object.keys(initial.content).length > 0
            ? (initial.content as TiptapDocument)
            : DEFAULT_DOC,
      };
    } else {
      map[code] = { name: "", subject: "", content: DEFAULT_DOC };
    }
  }
  return map;
}

/**
 * State form tạo/chỉnh sửa mẫu email đa ngôn ngữ (tab theo từng ngôn ngữ hệ thống),
 * tự sinh `htmlBody` cho từng bản dịch và hỗ trợ xem trước trộn biến theo tab đang mở.
 *
 * @param options - Mẫu hiện có (nếu sửa), quyền `manageAll`, ngữ cảnh và callback sau khi lưu.
 * @returns Form RHF, danh sách ngôn ngữ, state từng tab ngôn ngữ và state xem trước.
 */
export function useEmailTemplateForm({
  initial,
  canManageAll,
  routeContext = "admin",
  onSuccess,
}: {
  initial?: EmailTemplateDetail | null;
  canManageAll: boolean;
  routeContext?: RouteContext;
  onSuccess?: (saved: EmailTemplateDetail) => void;
}) {
  const t = useTranslations("system.emailTemplates");
  const router = useRouter();
  const { languages } = useSupportedLanguages();
  const langCodes = useMemo(() => languages.map((l) => l.code), [languages]);
  const [activeLang, setActiveLang] = useState<string>("vi");
  const [draftOverrides, setDraftOverrides] = useState<Record<string, TranslationDraft>>({});

  const translations = useMemo(() => {
    const base = buildInitialTranslations(initial, langCodes);
    return { ...base, ...draftOverrides };
  }, [draftOverrides, initial, langCodes]);

  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const previewMutation = usePreviewEmailTemplate();
  const [previewResult, setPreviewResult] = useState<EmailTemplatePreviewResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const extensions = useMemo(() => [...createEditorBaseExtensions(), MergeFieldNode], []);

  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      locale: initial?.locale ?? "vi",
      scope: initial?.scope ?? (canManageAll ? "SYSTEM" : "PERSONAL"),
      category: initial?.category ?? "FEEDBACK_THANKS",
      status: initial?.status ?? "ACTIVE",
      subject: initial?.subject ?? "",
      content: (initial?.content as Record<string, unknown>) ?? DEFAULT_DOC,
      htmlBody: initial?.htmlBody ?? "",
      variables: initial?.variables ?? [],
    },
  });

  useEffect(() => {
    if (!initial) return;
    form.reset({
      code: initial.code,
      name: initial.name,
      description: initial.description ?? "",
      locale: initial.locale || "vi",
      scope: initial.scope,
      category: initial.category,
      status: initial.status,
      subject: initial.subject,
      content: (initial.content as Record<string, unknown>) ?? DEFAULT_DOC,
      htmlBody: initial.htmlBody ?? "",
      variables: initial.variables ?? [],
    });
  }, [form, initial]);

  const updateTranslationField = <K extends keyof TranslationDraft>(
    lang: string,
    key: K,
    val: TranslationDraft[K],
  ) => {
    setDraftOverrides((prev) => {
      const current = prev[lang] ??
        translations[lang] ?? { name: "", subject: "", content: DEFAULT_DOC };
      return {
        ...prev,
        [lang]: {
          ...current,
          [key]: val,
        },
      };
    });
  };

  const submit = form.handleSubmit(async (values) => {
    const builtTranslations: Record<string, EmailTemplateTranslationItem> = {};
    for (const lang of langCodes) {
      const draft = translations[lang];
      if (!draft) continue;
      if (!draft.name.trim() && !draft.subject.trim() && lang !== "vi") continue;
      let htmlBody = "";
      try {
        htmlBody = generateHTML(draft.content, extensions);
      } catch {
        htmlBody = "";
      }
      builtTranslations[lang] = {
        name: draft.name.trim(),
        subject: draft.subject.trim(),
        content: draft.content as Record<string, unknown>,
        htmlBody,
      };
    }

    const primary = builtTranslations.vi ?? Object.values(builtTranslations)[0];
    if (!primary || !primary.name || !primary.subject) {
      toast.error(t("languages.primaryRequired"));
      return;
    }

    if (initial) {
      const saved = await updateMutation.mutateAsync({
        id: initial.id,
        input: {
          name: primary.name,
          description: values.description ?? "",
          locale: "vi",
          category: values.category,
          status: values.status,
          subject: primary.subject,
          content: primary.content,
          htmlBody: primary.htmlBody,
          translations: builtTranslations,
          variables: values.variables ?? [],
        },
      });
      toast.success(t("updated"));
      onSuccess?.(saved);
      return;
    }

    const saved = await createMutation.mutateAsync({
      code: values.code,
      name: primary.name,
      description: values.description ?? "",
      locale: "vi",
      scope: canManageAll ? values.scope : "PERSONAL",
      category: values.category,
      status: values.status,
      subject: primary.subject,
      content: primary.content,
      htmlBody: primary.htmlBody,
      translations: builtTranslations,
      variables: values.variables ?? [],
    });
    toast.success(t("created"));
    if (onSuccess) {
      onSuccess(saved);
    } else {
      const target =
        routeContext === "portal"
          ? { pathname: "/portal/email-templates/[id]" as const, params: { id: saved.id } }
          : SYSTEM_ROUTES.emailTemplateDetail(saved.id);
      router.replace(target as Parameters<typeof router.replace>[0]);
    }
  });

  const openPreview = async (sampleData: Record<string, unknown>) => {
    if (!initial) return;
    const result = await previewMutation.mutateAsync({
      id: initial.id,
      sampleData,
      locale: activeLang,
    });
    setPreviewResult(result);
    setPreviewOpen(true);
  };

  return {
    form,
    languages,
    activeLang,
    setActiveLang,
    translations,
    updateTranslationField,
    submit,
    isPending: createMutation.isPending || updateMutation.isPending,
    isPreviewPending: previewMutation.isPending,
    previewResult,
    previewOpen,
    setPreviewOpen,
    openPreview,
  };
}
