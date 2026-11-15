"use client";

import { ExternalLink, MousePointerClick, MoveVertical, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { AttachmentImageUploadView } from "@/modules/attachment/views/attachment-image-upload-view";
import { AttachmentTiptapImagePlugin } from "@/modules/attachment/views/attachment-tiptap-image-plugin";
import { ColorInput } from "@/shares/components/common/color-input/color-input";
import { Form } from "@/shares/components/common/form/form";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { RadioGroupField } from "@/shares/components/common/radio-group-field/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field/select-field";
import { SlugInput } from "@/shares/components/common/slug-input/slug-input";
import {
  TiptapPluginContext,
  useTiptapPluginRegistry,
} from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-plugins";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor/tiptap-editor";
import type { TiptapInsertItem } from "@/shares/components/common/tiptap-editor/types";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { Textarea } from "@/shares/components/ui/textarea";

import { CUSTOM_PAGES_ROUTES } from "../../constants/routes";
import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";
import { PAGE_STATUSES, PAGE_TEMPLATES, type PageDetail } from "../../types/custom-pages.types";
import { PageButtonDialog } from "./components/page-button-dialog";
import { PagePathSelect } from "./components/page-path-select";
import { usePageForm } from "./hooks/use-page-form";

/**
 * Form trang **một form cho tạo, sửa và xem**. Tạo: đường dẫn giữa (tạo/sửa nhanh bằng dialog), slug, tiêu đề,
 * mô tả, mẫu bắt đầu. Sửa: tab Nội dung (Tiptap + node riêng + plugin do page ghép như Mã QR), Giao diện, SEO,
 * Cài đặt; lưu một lần.
 *
 * @param props - Trang (khi sửa), quyền, plugin editor (slot), hàm tải lại khi lệch phiên bản.
 * @returns Form.
 */
export function PageForm({
  page,
  disabled = false,
  canCreatePath,
  canUpdatePath,
  editorPlugins,
  onReload,
}: {
  page?: PageDetail;
  disabled?: boolean;
  canCreatePath: boolean;
  canUpdatePath: boolean;
  editorPlugins?: ReactNode;
  onReload?: () => unknown;
}) {
  const t = useTranslations("customPages.pages");
  const tEditor = useTranslations("customPages.editor");
  const tCommon = useTranslations("common.actions");
  const state = usePageForm({ page, onReload });
  const registry = useTiptapPluginRegistry();
  const { form } = state;
  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const insertItems = useMemo<TiptapInsertItem[]>(
    () => [
      {
        key: "page-button",
        label: tEditor("button"),
        icon: MousePointerClick,
        run: state.openButtonDialog,
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
    [tEditor, state.openButtonDialog],
  );

  const settings = (
    <FormSection title={t("sections.settings")}>
      <FormField control={form.control} name="pathId" label={t("fields.path")} required>
        {(field) => (
          <PagePathSelect
            id={field.id}
            value={field.value}
            onChange={field.onChange}
            paths={state.paths.data ?? []}
            disabled={locked || state.paths.isPending}
            invalid={field["aria-invalid"]}
            canCreate={canCreatePath && !disabled}
            canUpdate={canUpdatePath && !disabled}
          />
        )}
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField control={form.control} name="title" label={t("fields.title")} required>
          {(field) => <Input {...field} maxLength={150} disabled={locked} autoFocus={!page} />}
        </FormField>
        <FormField
          control={form.control}
          name="slug"
          label={t("fields.slug")}
          description={page ? t("fields.slugChangeHint") : t("fields.slugHint")}
        >
          {(field) => <SlugInput {...field} placeholder="donate" disabled={locked} />}
        </FormField>
      </div>
      <FormField control={form.control} name="description" label={t("fields.description")}>
        {(field) => <Textarea {...field} rows={2} maxLength={1000} disabled={locked} />}
      </FormField>
      <FormField control={form.control} name="status" label={t("fields.status")}>
        {(field) => (
          <SelectField
            id={field.id}
            value={field.value}
            onValueChange={field.onChange}
            disabled={locked}
            options={PAGE_STATUSES.map((status) => ({
              value: status,
              label: t(`statuses.${status}`),
            }))}
          />
        )}
      </FormField>
      {page ? null : (
        <Controller
          control={form.control}
          name="template"
          render={({ field }) => (
            <RadioGroupField
              legend={t("fields.template")}
              value={field.value}
              onChange={field.onChange}
              disabled={locked}
              options={PAGE_TEMPLATES.map((template) => ({
                value: template,
                label: t(`templates.${template}`),
                description: t(`templates.${template}Hint`),
              }))}
            />
          )}
        />
      )}
    </FormSection>
  );

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {rootError ? (
        <p role="alert" className="text-destructive text-sm">
          {rootError}
        </p>
      ) : null}
      {state.conflict ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-xl border p-4"
        >
          <p className="flex-1 text-sm">{t("conflict")}</p>
          <Button type="button" variant="outline" onClick={() => void state.reload()}>
            {t("reload")}
          </Button>
        </div>
      ) : null}
      {page ? (
        <Tabs defaultValue="content" className="gap-6">
          <TabsList>
            <TabsTrigger value="content">{t("tabs.content")}</TabsTrigger>
            <TabsTrigger value="design">{t("tabs.design")}</TabsTrigger>
            <TabsTrigger value="seo">{t("tabs.seo")}</TabsTrigger>
            <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-3">
            {state.draft ? (
              <div className="bg-muted/60 flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <p className="flex-1 text-sm">{t("draftFound")}</p>
                <Button type="button" variant="outline" onClick={state.discardDraft}>
                  {t("draftDiscard")}
                </Button>
                <Button type="button" onClick={state.restoreDraft}>
                  {t("draftRestore")}
                </Button>
              </div>
            ) : null}
            <TiptapPluginContext.Provider value={registry}>
              <AttachmentTiptapImagePlugin />
              {editorPlugins}
              <Controller
                control={form.control}
                name="content"
                render={({ field }) => (
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    label={t("tabs.content")}
                    disabled={locked}
                    extensions={PAGE_EXTENSIONS}
                    insertItems={insertItems}
                  />
                )}
              />
            </TiptapPluginContext.Provider>
            <PageButtonDialog editor={state.buttonEditor} onClose={state.closeButtonDialog} />
          </TabsContent>
          <TabsContent value="design">
            <FormLayout
              aside={
                <FormSection title={t("sections.images")}>
                  <FormField control={form.control} name="avatar" label={t("fields.avatar")}>
                    {(field) => (
                      <AttachmentImageUploadView
                        value={field.value}
                        onChange={field.onChange}
                        disabled={locked}
                        aria-label={t("fields.avatar")}
                      />
                    )}
                  </FormField>
                  <FormField control={form.control} name="cover" label={t("fields.cover")}>
                    {(field) => (
                      <AttachmentImageUploadView
                        value={field.value}
                        onChange={field.onChange}
                        shape="square"
                        disabled={locked}
                        aria-label={t("fields.cover")}
                      />
                    )}
                  </FormField>
                </FormSection>
              }
            >
              <FormSection title={t("sections.theme")}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField control={form.control} name="themeMode" label={t("fields.themeMode")}>
                    {(field) => (
                      <SelectField
                        id={field.id}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={locked}
                        options={(["system", "light", "dark"] as const).map((mode) => ({
                          value: mode,
                          label: t(`themeModes.${mode}`),
                        }))}
                      />
                    )}
                  </FormField>
                  <FormField
                    control={form.control}
                    name="buttonStyle"
                    label={t("fields.buttonStyle")}
                  >
                    {(field) => (
                      <SelectField
                        id={field.id}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={locked}
                        options={(["rounded", "square", "pill"] as const).map((style) => ({
                          value: style,
                          label: t(`buttonStyles.${style}`),
                        }))}
                      />
                    )}
                  </FormField>
                  {(["primaryColor", "backgroundColor", "textColor"] as const).map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      label={t(`fields.${name}`)}
                    >
                      {(field) => (
                        <ColorInput
                          value={field.value}
                          onChange={field.onChange}
                          pickerLabel={t(`fields.${name}`)}
                          disabled={locked}
                          invalid={field["aria-invalid"]}
                        />
                      )}
                    </FormField>
                  ))}
                </div>
              </FormSection>
            </FormLayout>
          </TabsContent>
          <TabsContent value="seo">
            <FormSection title={t("sections.seo")}>
              <FormField
                control={form.control}
                name="seoTitle"
                label={t("fields.seoTitle")}
                description={t("fields.seoTitleHint")}
              >
                {(field) => <Input {...field} maxLength={160} disabled={locked} />}
              </FormField>
              <FormField
                control={form.control}
                name="seoDescription"
                label={t("fields.seoDescription")}
              >
                {(field) => <Textarea {...field} rows={3} maxLength={300} disabled={locked} />}
              </FormField>
            </FormSection>
          </TabsContent>
          <TabsContent value="settings">{settings}</TabsContent>
        </Tabs>
      ) : (
        settings
      )}
      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        {page ? (
          <Button type="button" variant="outline" asChild>
            <a href={page.publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              {t("view")}
            </a>
          </Button>
        ) : null}
        <Button type="button" variant="outline" asChild>
          <Link href={CUSTOM_PAGES_ROUTES.pages}>
            {disabled ? tCommon("back") : tCommon("cancel")}
          </Link>
        </Button>
        {disabled ? null : (
          <FormSubmitButton
            isSubmitting={state.isSubmitting}
            disabled={Boolean(page) && !form.formState.isDirty}
          >
            {page ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        )}
      </FormActions>
    </Form>
  );
}
