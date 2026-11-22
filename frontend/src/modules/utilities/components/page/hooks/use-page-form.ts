"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Editor } from "@tiptap/react";
import { MousePointerClick, MoveVertical, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import type { TiptapInsertItem } from "@/shares/components/common/tiptap-editor.types";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useCreatePage } from "../../../hooks/use-create-page";
import { usePagePathOptions } from "../../../hooks/use-page-path-options";
import { useUpdatePage } from "../../../hooks/use-update-page";
import {
  fromPage,
  PAGE_FORM_DEFAULTS,
  PAGE_FORM_FIELDS,
  pageSchema,
  type PageFormValues,
  toPageInput,
} from "../../../schemas/page.schema";
import type { PageDetail } from "../../../types/page.types";

const VERSION_CONFLICT = "UTILITIES_PAGE_VERSION_CONFLICT";
const DRAFT_PREFIX = "custom-page-draft:";

/** Bản nội dung chưa lưu giữ tạm trong trình duyệt (mất mạng, đóng tab nhầm). Storage bị chặn thì bỏ qua. */
function readDraft(id: string): PageFormValues["content"] | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + id);
    return raw ? (JSON.parse(raw) as PageFormValues["content"]) : null;
  } catch {
    return null;
  }
}

function writeDraft(id: string, content: PageFormValues["content"] | null): void {
  try {
    if (content) localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(content));
    else localStorage.removeItem(DRAFT_PREFIX + id);
  } catch {
    /* Storage bị chặn: không giữ bản nháp tạm. */
  }
}

/**
 * State form trang **một form cho tạo và sửa**: tạo (đường dẫn giữa, slug, tiêu đề, mẫu bắt đầu) → sang trang
 * soạn; sửa: nội dung Tiptap lưu một lần kèm `contentVersion` (lệch → báo "đã sửa ở nơi khác" + Tải lại),
 * bản chưa lưu giữ tạm trong trình duyệt.
 *
 * @param params - Trang đang sửa và hàm tải lại khi lệch phiên bản.
 * @returns Form, danh mục đường dẫn, trạng thái, handler.
 */
export function usePageForm({ page, onReload }: { page?: PageDetail; onReload?: () => unknown }) {
  const t = useTranslations("utilities.customPages.validation");
  const tEditor = useTranslations("utilities.customPages.editor");
  const router = useRouter();
  const create = useCreatePage();
  const update = useUpdatePage(page?.id ?? "");
  const paths = usePagePathOptions();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => pageSchema(t), [t]);
  const [conflict, setConflict] = useState(false);
  const [buttonEditor, setButtonEditor] = useState<Editor | null>(null);
  const form = useForm<PageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: PAGE_FORM_DEFAULTS,
    values: page ? fromPage(page) : undefined,
  });
  const content = useWatch({ control: form.control, name: "content" });
  const contentDirty = form.getFieldState("content", form.formState).isDirty;
  const [draft, setDraft] = useState<PageFormValues["content"] | null>(null);
  const [draftCheckedFor, setDraftCheckedFor] = useState<string | null>(null);

  // Mở trang khác (hoặc lần đầu): có bản tạm khác bản trên server (lần trước chưa lưu) → cho khôi phục.
  // Đồng bộ state theo prop ngay trong render (không dùng effect) để không render thừa.
  if (page && draftCheckedFor !== page.id) {
    setDraftCheckedFor(page.id);
    const saved = readDraft(page.id);
    setDraft(saved && JSON.stringify(saved) !== JSON.stringify(page.content) ? saved : null);
  }

  useEffect(() => {
    if (page && contentDirty) writeDraft(page.id, content);
  }, [page, content, contentDirty]);

  const insertItems = useMemo<TiptapInsertItem[]>(
    () => [
      {
        key: "page-button",
        label: tEditor("button"),
        icon: MousePointerClick,
        run: setButtonEditor,
      },
      {
        key: "page-callout",
        label: tEditor("callout"),
        icon: StickyNote,
        run: (editor) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { tone: "info" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      },
      {
        key: "page-spacer",
        label: tEditor("spacer"),
        icon: MoveVertical,
        run: (editor) =>
          editor
            .chain()
            .focus()
            .insertContent({ type: "spacer", attrs: { size: "md" } })
            .run(),
      },
    ],
    [tEditor],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setConflict(false);
    let saved: PageDetail;
    try {
      const input = toPageInput(values, page, contentDirty);
      saved = page ? await update.mutateAsync(input) : await create.mutateAsync(input);
    } catch (error) {
      if (isApiError(error) && error.code === VERSION_CONFLICT) {
        setConflict(true);
        return;
      }
      const fields = isApiError(error) ? error.fieldErrors() : {};
      const matched = PAGE_FORM_FIELDS.filter((name) => fields[name]);
      for (const name of matched) form.setError(name, { message: fields[name] });
      if (!matched.length) form.setError("root", { message: errorMessage(error) });
      return;
    }
    if (page) {
      writeDraft(page.id, null);
      setDraft(null);
    } else {
      router.push(UTILITIES_ROUTES.pageDetail(saved.id));
    }
  });

  return {
    form,
    paths,
    insertItems,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    conflict,
    reload: async () => {
      setConflict(false);
      if (page) writeDraft(page.id, null);
      await onReload?.();
    },
    draft,
    restoreDraft: () => {
      if (draft) form.setValue("content", draft, { shouldDirty: true });
      setDraft(null);
    },
    discardDraft: () => {
      if (page) writeDraft(page.id, null);
      setDraft(null);
    },
    buttonEditor,
    openButtonDialog: setButtonEditor,
    closeButtonDialog: () => setButtonEditor(null),
  };
}
