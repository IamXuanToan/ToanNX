"use client";

import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  Globe,
  Heart,
  History,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { AttachmentImageUploadView } from "@/modules/system/views/attachment/attachment-image-upload-view";
import { AttachmentTiptapImagePlugin } from "@/modules/system/views/attachment/attachment-tiptap-image-plugin";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormField } from "@/shares/components/common/form-field";
import { FormSection } from "@/shares/components/common/form-section";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { RadioGroupField } from "@/shares/components/common/radio-group-field";
import { SelectField } from "@/shares/components/common/select-field";
import { SlugInput } from "@/shares/components/common/slug-input";
import { useTabState } from "@/shares/hooks/use-tab-state";
import {
  TiptapPluginContext,
  useTiptapPluginRegistry,
} from "@/shares/components/common/hooks/use-tiptap-plugins";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { Textarea } from "@/shares/components/ui/textarea";

import { PAGE_TYPE } from "../../constants/page-constants";
import { THEME_PRESETS, type ThemePreset } from "../../constants/page-theme-presets";
import { UTILITIES_ROUTES } from "../../constants/routes";
import { PAGE_EXTENSIONS } from "../../extensions/page-extensions";
import { PAGE_STATUSES, PAGE_TYPES, type PageDetail } from "../../types/page.types";
import { QrCodeTiptapPlugin } from "../../views/qr-code/qr-code-tiptap-plugin";
import { ShortLinkTiptapPlugin } from "../../views/short-link/short-link-tiptap-plugin";
import { PagePathSelect } from "../page-path/page-path-select";
import { usePageForm } from "./hooks/use-page-form";
import { PageAffiliateCategoriesEditor } from "./page-affiliate-categories-editor";
import { PageAffiliateItemsEditor } from "./page-affiliate-items-editor";
import { PageBioEditor } from "./page-bio-editor";
import { PageDonationEditor } from "./page-donation-editor";
import { PageButtonDialog } from "./page-button-dialog";
import { PagePreviewFrame } from "./page-preview-frame";
import { PageThemeEditor } from "./page-theme-editor";
import { QuickAddModal } from "./quick-add-modal";

/**
 * Form trang **một form cho tạo, sửa và xem**:
 * - Hỗ trợ cả Template-Based Website System (Affiliate Storefront, Link-in-Bio, Donation VietQR)
 * - Tương thích 100% trang Tiptap Rich-Text cũ (Legacy Page).
 * - Split-Screen Workspace: biên tập nội dung bên trái, xem trước trực tiếp (Live Preview) bên phải.
 * - Hỗ trợ Quick Add dán link tự bóc tách ảnh/tên/giá qua API SSRF-safe.
 *
 * @param props - Trang (khi sửa), cờ vô hiệu hóa, quyền đường dẫn giữa và hàm tải lại khi xung đột phiên bản.
 * @returns Form trang.
 */
export function PageForm({
  page,
  disabled = false,
  canCreatePath,
  canUpdatePath,
  backHref,
  history,
  onCreated,
  onReload,
}: {
  page?: PageDetail;
  disabled?: boolean;
  canCreatePath: boolean;
  canUpdatePath: boolean;
  backHref?: string;
  history?: ReactNode;
  onCreated?: (saved: PageDetail) => void;
  onReload?: () => unknown;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const tCommon = useTranslations("common.actions");
  const tTabs = useTranslations("common.tabs");
  const state = usePageForm({ page, onReload, onCreated });
  const registry = useTiptapPluginRegistry();
  const [showLivePreview, setShowLivePreview] = useState(true);

  const { form, insertItems } = state;
  const locked = disabled || state.isSubmitting;
  const rootError = form.formState.errors.root?.message;
  const isAffiliate =
    state.pageType === PAGE_TYPE.AFFILIATE || state.pageType === PAGE_TYPE.PRODUCT_CATALOG;
  const isBio = state.pageType === PAGE_TYPE.BIO || state.pageType === PAGE_TYPE.PORTFOLIO;
  const isDonation = state.pageType === PAGE_TYPE.DONATION;
  const isLegacy = state.pageType === PAGE_TYPE.LEGACY_PAGE;

  const defaultTab = useMemo(() => {
    switch (state.pageType) {
      case PAGE_TYPE.AFFILIATE:
      case PAGE_TYPE.PRODUCT_CATALOG:
        return "products";
      case PAGE_TYPE.BIO:
      case PAGE_TYPE.PORTFOLIO:
        return "bio";
      case PAGE_TYPE.DONATION:
        return "donation";
      case PAGE_TYPE.LEGACY_PAGE:
        return "content";
      default:
        return "design";
    }
  }, [state.pageType]);

  const hasHistory = Boolean(history);
  const validTabs = useMemo(() => {
    const tabs = isLegacy ? ["settings"] : ["design", "settings"];
    if (isAffiliate) tabs.unshift("products", "categories");
    else if (isBio) tabs.unshift("bio");
    else if (isDonation) tabs.unshift("donation");
    else if (isLegacy) tabs.unshift("content");
    if (hasHistory) tabs.push("history");
    return tabs;
  }, [isAffiliate, isBio, isDonation, isLegacy, hasHistory]);

  const [activeTab, setActiveTab] = useTabState({
    validTabs,
    defaultTab,
  });
  const showPreviewPanel = showLivePreview && activeTab !== "history";

  const handleApplyPreset = (preset: ThemePreset, applyMode = true) => {
    form.setValue("primaryColor", preset.primary, { shouldDirty: true, shouldValidate: true });
    form.setValue("buttonStyle", preset.buttonStyle, { shouldDirty: true, shouldValidate: true });
    const nextMode = applyMode && preset.mode ? preset.mode : form.getValues("themeMode");
    if (applyMode && preset.mode) {
      form.setValue("themeMode", preset.mode, { shouldDirty: true, shouldValidate: true });
    }
    if (nextMode === "system") {
      form.setValue("backgroundColor", "", { shouldDirty: true, shouldValidate: true });
      form.setValue("textColor", "", { shouldDirty: true, shouldValidate: true });
    } else {
      form.setValue("backgroundColor", preset.bg, { shouldDirty: true, shouldValidate: true });
      form.setValue("textColor", preset.text, { shouldDirty: true, shouldValidate: true });
    }
    const currentStyleConfig = form.getValues("styleConfig") ?? {};
    form.setValue(
      "styleConfig",
      {
        ...currentStyleConfig,
        themePreset: preset.name.toLowerCase().replace(/\s+/g, "_"),
        primaryColor: preset.primary,
        ...(nextMode === "system" ? {} : { backgroundColor: preset.bg, textColor: preset.text }),
      },
      { shouldDirty: true },
    );
  };

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
          {(field) => (
            <SlugInput {...field} preserveCase placeholder="ToanToChill" disabled={locked} />
          )}
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
            options={PAGE_STATUSES.map((s) => ({
              value: s,
              label: t(`statuses.${s}`),
            }))}
          />
        )}
      </FormField>
      {page ? null : (
        <Controller
          control={form.control}
          name="pageType"
          render={({ field }) => (
            <RadioGroupField
              legend={t("fields.pageType")}
              value={field.value}
              onChange={(nextType) => {
                field.onChange(nextType);
                if (nextType === PAGE_TYPE.AFFILIATE) {
                  handleApplyPreset(THEME_PRESETS[0], false);
                } else if (nextType === PAGE_TYPE.BIO) {
                  handleApplyPreset(THEME_PRESETS[1], false);
                } else if (nextType === PAGE_TYPE.DONATION) {
                  handleApplyPreset(THEME_PRESETS[2], false);
                }
              }}
              disabled={locked}
              options={PAGE_TYPES.map((pt) => ({
                value: pt,
                label: t(`pageTypes.${pt}`),
                description: t(`pageTypes.${pt}Hint`),
              }))}
            />
          )}
        />
      )}
      {page ? (
        <div className="border-border bg-card/60 mt-4 space-y-2 rounded-xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="text-primary size-4" />
              <span className="text-xs font-semibold">{t("quickLink")}</span>
            </div>
            <span className="text-muted-foreground text-[11px]">{t("quickLinkHint")}</span>
          </div>
          <div className="border-border bg-background flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:justify-between">
            <AppTooltip content={page.publicUrl}>
              <span className="text-foreground min-w-0 truncate font-mono text-xs font-medium">
                {page.publicUrl}
              </span>
            </AppTooltip>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(page.publicUrl);
                  toast.success(t("copied"));
                }}
                className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              >
                <Copy className="size-3.5" />
                <span>{t("copyLink")}</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              >
                <Link href={page.publicUrl as never} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span>{t("openLink")}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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

      <div className="space-y-4">
        <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
              {state.pageType === PAGE_TYPE.AFFILIATE ? (
                <ShoppingBag className="text-primary size-3.5" />
              ) : state.pageType === PAGE_TYPE.BIO ? (
                <UserCheck className="text-primary size-3.5" />
              ) : state.pageType === PAGE_TYPE.DONATION ? (
                <Heart className="text-destructive size-3.5" />
              ) : (
                <FileText className="text-muted-foreground size-3.5" />
              )}
              <span>{t(`pageTypes.${state.pageType}`)}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!page ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                asChild
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <Link href={UTILITIES_ROUTES.demo} target="_blank">
                  <Sparkles className="text-primary size-3.5" />
                  <span>{t("viewLiveDemo")}</span>
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs"
            >
              {showLivePreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span className="hidden sm:inline">
                {showLivePreview ? t("togglePreview.hide") : t("togglePreview.show")}
              </span>
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreviewPanel ? "xl:grid-cols-12" : "grid-cols-1"}`}>
          {/* Form Section bên trái */}
          <div className={showPreviewPanel ? "min-w-0 xl:col-span-6 2xl:col-span-7" : "min-w-0"}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full max-w-full scrollbar-none justify-start overflow-x-auto">
                {isAffiliate ? (
                  <>
                    <TabsTrigger
                      value="products"
                      className="gap-1.5 px-3 py-1.5 text-xs font-medium"
                    >
                      <Package className="size-3.5" />
                      <span>{t("tabs.products")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="categories"
                      className="gap-1.5 px-3 py-1.5 text-xs font-medium"
                    >
                      <FolderTree className="size-3.5" />
                      <span>{t("tabs.categories")}</span>
                    </TabsTrigger>
                  </>
                ) : null}
                {isBio ? (
                  <TabsTrigger value="bio" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <UserCheck className="size-3.5" />
                    <span>{t("tabs.bio")}</span>
                  </TabsTrigger>
                ) : null}
                {isDonation ? (
                  <TabsTrigger value="donation" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <Heart className="size-3.5" />
                    <span>{t("tabs.donation")}</span>
                  </TabsTrigger>
                ) : null}
                {isLegacy ? (
                  <TabsTrigger value="content" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <FileText className="size-3.5" />
                    <span>{t("tabs.content")}</span>
                  </TabsTrigger>
                ) : null}
                {!isLegacy ? (
                  <TabsTrigger value="design" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <Palette className="size-3.5" />
                    <span>{t("tabs.design")}</span>
                  </TabsTrigger>
                ) : null}
                <TabsTrigger value="settings" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Settings className="size-3.5" />
                  <span>{t("tabs.settings")}</span>
                </TabsTrigger>
                {history ? (
                  <TabsTrigger value="history" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <History className="size-3.5" />
                    <span>{tTabs("history")}</span>
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <div
                className={
                  activeTab === "history"
                    ? "hidden"
                    : "border-border bg-card rounded-xl border p-4 shadow-2xs"
                }
              >
                {isAffiliate ? (
                  <>
                    <TabsContent value="products">
                      <PageAffiliateItemsEditor
                        items={state.affiliateItems}
                        categories={state.affiliateCategories}
                        onRemoveItem={state.removeAffiliateProduct}
                        onEditItem={state.openEditProduct}
                        onReorderItems={state.reorderAffiliateProducts}
                        onOpenAddManual={state.openAddProduct}
                        onOpenQuickAdd={state.openQuickAdd}
                        onImportItems={state.importAffiliateProducts}
                        showPrice={state.showPrice}
                        onToggleShowPrice={state.toggleShowPrice}
                        disabled={locked}
                      />
                    </TabsContent>
                    <TabsContent value="categories">
                      <PageAffiliateCategoriesEditor
                        categories={state.affiliateCategories}
                        onAddCategory={state.addCategory}
                        onRemoveCategory={state.removeCategory}
                        onUpdateCategory={state.updateCategory}
                        onReorderCategories={state.reorderCategories}
                        disabled={locked}
                      />
                    </TabsContent>
                  </>
                ) : null}

                {isBio ? (
                  <TabsContent value="bio">
                    <PageBioEditor
                      config={state.bioConfig}
                      onChange={state.updateBioConfig}
                      disabled={locked}
                    />
                  </TabsContent>
                ) : null}

                {isDonation ? (
                  <TabsContent value="donation">
                    <PageDonationEditor
                      config={state.donationConfig}
                      onChange={state.updateDonationConfig}
                      disabled={locked}
                    />
                  </TabsContent>
                ) : null}

                {isLegacy ? (
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
                      <QrCodeTiptapPlugin />
                      <ShortLinkTiptapPlugin />
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
                    <PageButtonDialog
                      editor={state.buttonEditor}
                      onClose={state.closeButtonDialog}
                    />
                  </TabsContent>
                ) : null}

                {!isLegacy ? (
                  <TabsContent value="design" className="space-y-6">
                    <FormSection title={t("sections.images")}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="avatar"
                          label={t("fields.avatar")}
                          tooltip={t("fields.avatarTooltip")}
                        >
                          {(field) => (
                            <AttachmentImageUploadView
                              value={field.value}
                              onChange={field.onChange}
                              disabled={locked}
                              hideHint
                              aria-label={t("fields.avatar")}
                            />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="cover"
                          label={t("fields.cover")}
                          tooltip={t("fields.coverTooltip")}
                        >
                          {(field) => (
                            <AttachmentImageUploadView
                              value={field.value}
                              onChange={field.onChange}
                              shape="square"
                              disabled={locked}
                              hideHint
                              aria-label={t("fields.cover")}
                            />
                          )}
                        </FormField>
                      </div>
                    </FormSection>

                    <PageThemeEditor
                      control={form.control}
                      setValue={form.setValue}
                      disabled={locked}
                      onApplyPreset={handleApplyPreset}
                    />
                  </TabsContent>
                ) : null}

                <TabsContent value="settings">{settings}</TabsContent>
              </div>
              {history ? <TabsContent value="history">{history}</TabsContent> : null}
            </Tabs>
          </div>

          {/* Live Preview Frame bên phải */}
          {showPreviewPanel ? (
            <div className="min-w-0 xl:col-span-6 2xl:col-span-5">
              <div className="sticky top-[var(--tiptap-sticky-top,1.5rem)]">
                <PagePreviewFrame
                  page={state.livePreviewData}
                  device={state.previewDevice}
                  onDeviceChange={state.setPreviewDevice}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal Thêm & Sửa sản phẩm bằng URL hoặc tải ảnh */}
      <QuickAddModal
        open={state.quickAddOpen}
        initialMode={state.productModalMode}
        categories={state.affiliateCategories}
        editingItem={state.editingProduct}
        onAdd={state.addAffiliateProduct}
        onSave={state.updateAffiliateProduct}
        onClose={() => {
          state.setQuickAddOpen(false);
          state.setEditingProduct(null);
        }}
      />

      <FormActions start={form.formState.isDirty ? tCommon("unsaved") : undefined}>
        {page?.publicUrl ? (
          <Button type="button" variant="outline" asChild className="gap-1.5">
            <Link href={page.publicUrl as never} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              <span>{t("view")}</span>
            </Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" asChild>
          <Link href={(backHref ?? UTILITIES_ROUTES.pages) as never}>{tCommon("back")}</Link>
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
