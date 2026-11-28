"use client";

import type { Editor } from "@tiptap/react";
import { Braces, Eye, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { useWatch } from "react-hook-form";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { FormField } from "@/shares/components/common/form-field";
import { SelectField } from "@/shares/components/common/select-field";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor";
import type {
  TiptapDocument,
  TiptapInsertItem,
} from "@/shares/components/common/tiptap-editor.types";
import { Button } from "@/shares/components/ui/button";
import { Field, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { Textarea } from "@/shares/components/ui/textarea";

import type { EmailTemplateDetail } from "../../types/email-template.types";
import { EmailTemplatePreviewDialog } from "./email-template-preview-dialog";
import { useEmailTemplateForm } from "./hooks/use-email-template-form";
import { getMergeFieldsForCategory, hydrateMergeFieldsInDoc } from "./merge-field-helpers";
import { MergeFieldNode } from "./merge-field-node";

type RouteContext = "admin" | "portal";

const EMAIL_EDITOR_EXTENSIONS = [MergeFieldNode];

/**
 * Form tạo / chi tiết / chỉnh sửa mẫu email đa ngôn ngữ dạng Tab (`vi`, `en`, + ngôn ngữ Admin thêm),
 * tích hợp TiptapEditor, badge trường trộn, nút chèn nhanh và Viết bằng AI.
 *
 * @param props - Dữ liệu ban đầu, quyền `manageAll`, ngữ cảnh điều hướng và callback sau khi lưu.
 * @returns Biểu mẫu mẫu email đa ngôn ngữ.
 */
export function EmailTemplateForm({
  initial,
  canManageAll,
  canEdit = true,
  routeContext = "admin",
  onSuccess,
}: {
  initial?: EmailTemplateDetail | null;
  canManageAll: boolean;
  canEdit?: boolean;
  routeContext?: RouteContext;
  onSuccess?: (saved: EmailTemplateDetail) => void;
}) {
  const t = useTranslations("system.emailTemplates");
  const tCommon = useTranslations("common");
  const readOnly = Boolean(initial) && !canEdit;
  const editorRefs = useRef<Record<string, Editor | null>>({});

  const state = useEmailTemplateForm({ initial, canManageAll, routeContext, onSuccess });
  const { form } = state;
  const watchedCategory = useWatch({ control: form.control, name: "category" });

  const mergeFields = useMemo(
    () => getMergeFieldsForCategory(watchedCategory ?? "FEEDBACK_THANKS"),
    [watchedCategory],
  );

  const labelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of mergeFields) {
      map.set(f.key, t(`mergeFields.labels.${f.key}` as Parameters<typeof t>[0]));
    }
    return map;
  }, [mergeFields, t]);

  const insertMergeFieldIntoEditor = useCallback(
    (editor: Editor | null, key: string) => {
      if (!editor) return;
      const label = labelByKey.get(key) ?? "";
      editor
        .chain()
        .focus()
        .insertContent([
          { type: "mergeField", attrs: { fieldKey: key, label } },
          { type: "text", text: " " },
        ])
        .run();
    },
    [labelByKey],
  );

  const insertItems = useMemo<TiptapInsertItem[]>(
    () =>
      mergeFields.map((field) => ({
        key: `merge_${field.key}`,
        label: `${labelByKey.get(field.key) ?? field.key} ({{${field.key}}})`,
        icon: Braces,
        run: (editor) => insertMergeFieldIntoEditor(editor, field.key),
      })),
    [insertMergeFieldIntoEditor, labelByKey, mergeFields],
  );

  const aiContextHint = useMemo(() => {
    const list = mergeFields
      .map((f) => `{{${f.key}}} (${labelByKey.get(f.key) ?? f.key})`)
      .join(", ");
    return (
      `Ngữ cảnh: Đây là nội dung mẫu email nhóm ${watchedCategory} (ngôn ngữ ${state.activeLang}). ` +
      `Khi viết, viết lại hoặc chỉnh sửa nội dung, bắt buộc giữ nguyên cú pháp biến {{...}} và sử dụng đúng các biến trộn sau nếu phù hợp: ${list}.`
    );
  }, [labelByKey, mergeFields, state.activeLang, watchedCategory]);

  const sampleData = useMemo(() => {
    const data: Record<string, string> = {};
    for (const f of mergeFields) data[f.key] = f.sample;
    return data;
  }, [mergeFields]);

  const appendToSubject = (lang: string, key: string) => {
    const current = state.translations[lang]?.subject ?? "";
    const token = `{{${key}}}`;
    const next = current ? `${current.trimEnd()} ${token}` : token;
    state.updateTranslationField(lang, "subject", next);
  };

  return (
    <>
      <form onSubmit={state.submit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            label={t("fields.code")}
            required
            description={t("hints.code")}
          >
            {(field) => (
              <Input
                {...field}
                disabled={readOnly || Boolean(initial)}
                placeholder="feedback_thank_you_custom"
              />
            )}
          </FormField>

          <FormField control={form.control} name="category" label={t("fields.category")} required>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly}
                options={[
                  { value: "FEEDBACK_THANKS", label: t("categories.FEEDBACK_THANKS") },
                  ...(routeContext === "admin"
                    ? [
                        { value: "AUTH", label: t("categories.AUTH") },
                        { value: "NOTIFICATION", label: t("categories.NOTIFICATION") },
                      ]
                    : []),
                  { value: "CUSTOM", label: t("categories.CUSTOM") },
                ]}
              />
            )}
          </FormField>

          <FormField control={form.control} name="status" label={t("fields.status")} required>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly}
                options={[
                  { value: "ACTIVE", label: t("statuses.ACTIVE") },
                  { value: "DRAFT", label: t("statuses.DRAFT") },
                  { value: "ARCHIVED", label: t("statuses.ARCHIVED") },
                ]}
              />
            )}
          </FormField>

          <FormField control={form.control} name="scope" label={t("fields.scope")} required>
            {(field) => (
              <SelectField
                id={field.id}
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly || !canManageAll || Boolean(initial)}
                options={[
                  ...(canManageAll ? [{ value: "SYSTEM", label: t("scopes.SYSTEM") }] : []),
                  { value: "PERSONAL", label: t("scopes.PERSONAL") },
                ]}
              />
            )}
          </FormField>
        </div>

        <FormField control={form.control} name="description" label={t("fields.description")}>
          {(field) => (
            <Textarea
              {...field}
              value={field.value ?? ""}
              disabled={readOnly}
              rows={2}
              placeholder={t("placeholders.description")}
            />
          )}
        </FormField>

        <Tabs value={state.activeLang} onValueChange={state.setActiveLang} className="space-y-4">
          <TabsList className="flex-wrap">
            {state.languages.map((lang) => (
              <TabsTrigger key={lang.code} value={lang.code} className="gap-1.5">
                <span className="font-mono text-xs uppercase">{lang.code}</span>
                <span>·</span>
                <span>{lang.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {state.languages.map((lang) => {
            const draft = state.translations[lang.code] ?? {
              name: "",
              subject: "",
              content: { type: "doc", content: [{ type: "paragraph" }] } as TiptapDocument,
            };
            const hydratedDoc = hydrateMergeFieldsInDoc(draft.content, labelByKey);
            return (
              <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      {t("fields.name")} ({lang.code.toUpperCase()})
                    </FieldLabel>
                    <Input
                      value={draft.name}
                      disabled={readOnly}
                      onChange={(e) =>
                        state.updateTranslationField(lang.code, "name", e.target.value)
                      }
                      placeholder={t("placeholders.name")}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t("fields.subject")} ({lang.code.toUpperCase()})
                    </FieldLabel>
                    <Input
                      value={draft.subject}
                      disabled={readOnly}
                      onChange={(e) =>
                        state.updateTranslationField(lang.code, "subject", e.target.value)
                      }
                      placeholder={t("placeholders.subject")}
                    />
                  </Field>
                </div>

                <div className="bg-muted/40 space-y-2.5 rounded-xl border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{t("mergeFields.title")}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("mergeFields.quickInsertHint")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mergeFields.map((field) => {
                      const displayLabel = labelByKey.get(field.key) ?? field.key;
                      return (
                        <div key={field.key} className="inline-flex items-center">
                          <AppTooltip
                            content={t("mergeFields.insertBodyTooltip", { key: field.key })}
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={readOnly}
                              onClick={() =>
                                insertMergeFieldIntoEditor(
                                  editorRefs.current[lang.code] ?? null,
                                  field.key,
                                )
                              }
                              className="border-primary/25 bg-primary/5 hover:bg-primary/15 text-primary h-7 rounded-r-none px-2.5 font-mono text-xs"
                            >
                              <Plus className="mr-1 size-3" aria-hidden="true" />
                              <span>{displayLabel}</span>
                              <span className="text-muted-foreground ml-1.5 text-[11px]">{`{{${field.key}}}`}</span>
                            </Button>
                          </AppTooltip>
                          <AppTooltip
                            content={t("mergeFields.insertSubjectTooltip", { key: field.key })}
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={readOnly}
                              aria-label={t("mergeFields.insertSubjectTooltip", { key: field.key })}
                              onClick={() => appendToSubject(lang.code, field.key)}
                              className="border-primary/25 bg-background hover:bg-primary/10 text-muted-foreground h-7 rounded-l-none border-l-0 px-1.5 text-[11px]"
                            >
                              S
                            </Button>
                          </AppTooltip>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-muted-foreground text-xs">{t("mergeFields.hint")}</p>
                </div>

                <Field>
                  <FieldLabel>
                    {t("fields.content")} ({lang.code.toUpperCase()})
                  </FieldLabel>
                  <TiptapEditor
                    label={`${t("fields.content")} (${lang.code.toUpperCase()})`}
                    value={hydratedDoc}
                    onChange={(doc) =>
                      state.updateTranslationField(
                        lang.code,
                        "content",
                        hydrateMergeFieldsInDoc(doc, labelByKey),
                      )
                    }
                    disabled={readOnly}
                    extensions={EMAIL_EDITOR_EXTENSIONS}
                    insertItems={insertItems}
                    aiContextHint={aiContextHint}
                    onEditorReady={(ed) => {
                      editorRefs.current[lang.code] = ed;
                    }}
                    showStats
                  />
                </Field>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {initial ? (
            <Button
              type="button"
              variant="outline"
              disabled={state.isPreviewPending}
              onClick={() => state.openPreview(sampleData)}
            >
              <Eye className="mr-2 size-4" />
              {t("actions.preview")}
            </Button>
          ) : null}

          {!readOnly ? (
            <Button type="submit" disabled={state.isPending}>
              {initial ? tCommon("actions.save") : tCommon("actions.create")}
            </Button>
          ) : null}
        </div>
      </form>

      <EmailTemplatePreviewDialog
        open={state.previewOpen}
        onOpenChange={state.setPreviewOpen}
        preview={state.previewResult}
      />
    </>
  );
}
