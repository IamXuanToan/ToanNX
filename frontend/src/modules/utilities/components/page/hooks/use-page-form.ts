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

import { PAGE_TYPE } from "../../../constants/page-constants";
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
import type {
  AffiliateCategory,
  AffiliateContentConfig,
  AffiliateItem,
  BioContentConfig,
  DonationContentConfig,
  DonationQrItem,
  PageDetail,
  PublicPage,
} from "../../../types/page.types";

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
 * State form trang: hỗ trợ tạo/sửa cả trang Template (Affiliate, Bio, Donation) lẫn trang Legacy Tiptap,
 * tích hợp live preview tức thì và modal thêm nhanh sản phẩm bằng URL.
 *
 * @param params - Trang đang sửa và hàm tải lại khi lệch phiên bản.
 * @returns Form, danh mục đường dẫn, trạng thái, live preview data và các handler.
 */
export function usePageForm({
  page,
  onReload,
  onCreated,
}: {
  page?: PageDetail;
  onReload?: () => unknown;
  onCreated?: (saved: PageDetail) => void;
}) {
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
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"quick" | "manual">("manual");
  const [editingProduct, setEditingProduct] = useState<AffiliateItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const form = useForm<PageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: PAGE_FORM_DEFAULTS,
    values: page ? fromPage(page) : undefined,
  });

  const content = useWatch({ control: form.control, name: "content" });
  const contentConfig = useWatch({ control: form.control, name: "contentConfig" });
  const styleConfig = useWatch({ control: form.control, name: "styleConfig" });
  const responsiveConfig = useWatch({ control: form.control, name: "responsiveConfig" });
  const pageType = useWatch({ control: form.control, name: "pageType" });
  const templateKey = useWatch({ control: form.control, name: "templateKey" });
  const title = useWatch({ control: form.control, name: "title" });
  const description = useWatch({ control: form.control, name: "description" });
  const primaryColor = useWatch({ control: form.control, name: "primaryColor" });
  const backgroundColor = useWatch({ control: form.control, name: "backgroundColor" });
  const textColor = useWatch({ control: form.control, name: "textColor" });
  const themeMode = useWatch({ control: form.control, name: "themeMode" });
  const buttonStyle = useWatch({ control: form.control, name: "buttonStyle" });
  const slug = useWatch({ control: form.control, name: "slug" });
  const status = useWatch({ control: form.control, name: "status" });
  const avatar = useWatch({ control: form.control, name: "avatar" });
  const cover = useWatch({ control: form.control, name: "cover" });

  const contentDirty = form.getFieldState("content", form.formState).isDirty;
  const [draft, setDraft] = useState<PageFormValues["content"] | null>(null);
  const [draftCheckedFor, setDraftCheckedFor] = useState<string | null>(null);

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

  // Thao tác với sản phẩm Affiliate
  const affiliateConfig = contentConfig as unknown as AffiliateContentConfig | undefined;
  const affiliateItems = affiliateConfig?.items ?? [];
  const affiliateCategories = affiliateConfig?.categories ?? [];

  const addAffiliateProduct = (newItem: AffiliateItem) => {
    const updated = {
      ...(contentConfig ?? {}),
      items: [newItem, ...affiliateItems],
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const removeAffiliateProduct = (itemId: string) => {
    const updated = {
      ...(contentConfig ?? {}),
      items: affiliateItems.filter((it) => it.id !== itemId),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const reorderAffiliateProducts = (newItems: AffiliateItem[]) => {
    const updated = {
      ...(contentConfig ?? {}),
      items: newItems.map((item, idx) => ({ ...item, sortOrder: idx })),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const updateAffiliateProduct = (updatedItem: AffiliateItem) => {
    const updated = {
      ...(contentConfig ?? {}),
      items: affiliateItems.map((it) => (it.id === updatedItem.id ? updatedItem : it)),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const importAffiliateProducts = (
    newItems: AffiliateItem[],
    newCategories: AffiliateCategory[],
    mode: "append" | "replace",
  ) => {
    const mergedItems = mode === "replace" ? newItems : [...affiliateItems, ...newItems];
    const existingCatIds = new Set(affiliateCategories.map((c) => c.id));
    const catsToAdd = newCategories.filter((c) => !existingCatIds.has(c.id));
    const mergedCats = [...affiliateCategories, ...catsToAdd];
    form.setValue(
      "contentConfig",
      { ...(contentConfig ?? {}), items: mergedItems, categories: mergedCats },
      { shouldDirty: true },
    );
  };

  const addCategory = (name: string) => {
    if (!name.trim()) return;
    const newCat: AffiliateCategory = {
      id: "cat-" + Date.now(),
      name: name.trim(),
      slug: "cat-" + Date.now(),
      sortOrder: affiliateCategories.length + 1,
      isVisible: true,
    };
    const updated = {
      ...(contentConfig ?? {}),
      categories: [...affiliateCategories, newCat],
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const removeCategory = (catId: string) => {
    const updated = {
      ...(contentConfig ?? {}),
      categories: affiliateCategories.filter((c) => c.id !== catId),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const reorderCategories = (newCategories: AffiliateCategory[]) => {
    const updated = {
      ...(contentConfig ?? {}),
      categories: newCategories.map((cat, idx) => ({ ...cat, sortOrder: idx })),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const updateCategory = (catId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = {
      ...(contentConfig ?? {}),
      categories: affiliateCategories.map((c) =>
        c.id === catId ? { ...c, name: newName.trim() } : c,
      ),
    };
    form.setValue("contentConfig", updated, { shouldDirty: true });
  };

  const rawStyle = (useWatch({ control: form.control, name: "styleConfig" }) ?? {}) as Record<
    string,
    unknown
  >;
  const showPrice = rawStyle.showPrice !== false && rawStyle.show_price !== false;

  const toggleShowPrice = (show: boolean) => {
    const currentStyle = (form.getValues("styleConfig") ?? {}) as Record<string, unknown>;
    form.setValue(
      "styleConfig",
      {
        ...currentStyle,
        showPrice: show,
      },
      { shouldDirty: true },
    );
  };

  // Thao tác với cấu hình Bio / Portfolio
  const bioConfig = useMemo<BioContentConfig>(() => {
    const raw = (contentConfig ?? {}) as Record<string, unknown>;
    const rawProfile = (raw.profile as Record<string, unknown>) ?? {};
    return {
      profile: {
        displayName:
          (rawProfile.displayName as string) || (rawProfile.display_name as string) || "",
        headline: (rawProfile.headline as string) ?? "",
        bioText: (rawProfile.bioText as string) || (rawProfile.bio_text as string) || "",
        avatarUrl:
          (rawProfile.avatarUrl as string) || (rawProfile.avatar_url as string) || undefined,
        location: (rawProfile.location as string) ?? undefined,
        email: (rawProfile.email as string) ?? undefined,
        website: (rawProfile.website as string) ?? undefined,
      },
      experiences: (raw.experiences as BioContentConfig["experiences"]) ?? [],
      skills: (raw.skills as BioContentConfig["skills"]) ?? [],
      projects: (raw.projects as BioContentConfig["projects"]) ?? [],
      links: (raw.links as BioContentConfig["links"]) ?? [],
    };
  }, [contentConfig]);

  const updateBioConfig = (next: BioContentConfig) => {
    form.setValue("contentConfig", next as unknown as Record<string, unknown>, {
      shouldDirty: true,
    });
  };

  // Thao tác với cấu hình Donation
  const donationConfig = useMemo<DonationContentConfig>(() => {
    const raw = (contentConfig ?? {}) as Record<string, unknown>;
    const rawCreator = (raw.creator as Record<string, unknown>) ?? {};
    const rawBank = (raw.bankAccount ?? raw.bank_account ?? {}) as Record<string, unknown>;
    return {
      creator: {
        name: (rawCreator.name as string) ?? "",
        message: (rawCreator.message as string) ?? "",
        thankYouMessage:
          (rawCreator.thankYouMessage as string) || (rawCreator.thank_you_message as string) || "",
      },
      bankAccount: {
        bankName: (rawBank.bankName as string) || (rawBank.bank_name as string) || "MBBank",
        accountNumber:
          (rawBank.accountNumber as string) || (rawBank.account_number as string) || "",
        accountHolder:
          (rawBank.accountHolder as string) || (rawBank.account_holder as string) || "",
      },
      displayMode:
        (raw.displayMode as "single" | "multiple") ??
        (raw.display_mode as "single" | "multiple") ??
        "multiple",
      qrCodes: (raw.qrCodes as DonationQrItem[]) ?? (raw.qr_codes as DonationQrItem[]) ?? [],
      suggestedAmounts: (raw.suggestedAmounts as DonationContentConfig["suggestedAmounts"]) ??
        (raw.suggested_amounts as DonationContentConfig["suggestedAmounts"]) ?? [
          { amount: 30000, label: "1 ly cafe (30.000 ₫)", icon: "coffee" },
          { amount: 50000, label: "1 bữa sáng (50.000 ₫)", icon: "utensils" },
          { amount: 100000, label: "1 cuốn sách (100.000 ₫)", icon: "book" },
        ],
      minAmount:
        typeof raw.minAmount === "number"
          ? raw.minAmount
          : typeof raw.min_amount === "number"
            ? raw.min_amount
            : undefined,
      allowCustomAmount:
        typeof raw.allowCustomAmount === "boolean"
          ? raw.allowCustomAmount
          : typeof raw.allow_custom_amount === "boolean"
            ? raw.allow_custom_amount
            : true,
      options: raw.options as DonationContentConfig["options"],
    };
  }, [contentConfig]);

  const updateDonationConfig = (next: DonationContentConfig) => {
    form.setValue("contentConfig", next as unknown as Record<string, unknown>, {
      shouldDirty: true,
    });
  };

  // Live preview data
  const contentConfigRecord = (contentConfig as Record<string, unknown>) ?? {};
  const profileRecord = (contentConfigRecord.profile as Record<string, unknown>) ?? {};
  const resolvedAvatarUrl: string | null =
    avatar?.url ??
    (typeof contentConfigRecord.avatarUrl === "string" ? contentConfigRecord.avatarUrl : null) ??
    (typeof contentConfigRecord.avatar_url === "string" ? contentConfigRecord.avatar_url : null) ??
    (typeof profileRecord.avatarUrl === "string" ? profileRecord.avatarUrl : null) ??
    (typeof profileRecord.avatar_url === "string" ? profileRecord.avatar_url : null) ??
    null;
  const resolvedCoverUrl: string | null =
    cover?.url ??
    (typeof contentConfigRecord.coverUrl === "string" ? contentConfigRecord.coverUrl : null) ??
    (typeof contentConfigRecord.cover_url === "string" ? contentConfigRecord.cover_url : null) ??
    (typeof profileRecord.coverUrl === "string" ? profileRecord.coverUrl : null) ??
    (typeof profileRecord.cover_url === "string" ? profileRecord.cover_url : null) ??
    null;

  const livePreviewData: PublicPage = useMemo(
    () => ({
      id: page?.id,
      segment: page?.path?.segment ?? "p",
      slug: slug || page?.slug || "demo",
      status: status || page?.status || "DRAFT",
      preview: true,
      title: title || "Tiêu đề trang",
      description: description || "",
      canonical_url: "",
      canonicalUrl: "",
      seo_title: "",
      seoTitle: "",
      seo_description: "",
      seoDescription: "",
      avatar_url: resolvedAvatarUrl,
      avatarUrl: resolvedAvatarUrl,
      cover_url: resolvedCoverUrl,
      coverUrl: resolvedCoverUrl,
      pageType: pageType || PAGE_TYPE.AFFILIATE,
      templateKey: templateKey || "product_grid",
      templateVersion: 1,
      contentConfig: (contentConfig as Record<string, unknown>) ?? {},
      styleConfig: {
        ...(styleConfig ?? {}),
        primaryColor: primaryColor || "#3D812E",
        backgroundColor: backgroundColor || undefined,
        textColor: textColor || undefined,
      },
      responsiveConfig: (responsiveConfig as Record<string, unknown>) ?? {},
      theme: {
        mode: themeMode || "system",
        primaryColor: primaryColor || "#3D812E",
        backgroundColor: backgroundColor || undefined,
        textColor: textColor || undefined,
        buttonStyle: buttonStyle || "rounded",
      },
      content: content || { type: "doc", content: [{ type: "paragraph" }] },
    }),
    [
      page,
      slug,
      status,
      title,
      description,
      resolvedAvatarUrl,
      resolvedCoverUrl,
      pageType,
      templateKey,
      contentConfig,
      styleConfig,
      responsiveConfig,
      primaryColor,
      backgroundColor,
      textColor,
      themeMode,
      buttonStyle,
      content,
    ],
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
    } else if (onCreated) {
      onCreated(saved);
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

    // Template state & handlers
    pageType,
    templateKey,
    quickAddOpen,
    setQuickAddOpen,
    productModalMode,
    setProductModalMode,
    openAddProduct: () => {
      setEditingProduct(null);
      setProductModalMode("manual");
      setQuickAddOpen(true);
    },
    openQuickAdd: () => {
      setEditingProduct(null);
      setProductModalMode("quick");
      setQuickAddOpen(true);
    },
    openEditProduct: (item: AffiliateItem) => {
      setEditingProduct(item);
      setProductModalMode("manual");
      setQuickAddOpen(true);
    },
    previewDevice,
    setPreviewDevice,
    affiliateItems,
    affiliateCategories,
    addAffiliateProduct,
    removeAffiliateProduct,
    updateAffiliateProduct,
    reorderAffiliateProducts,
    importAffiliateProducts,
    editingProduct,
    setEditingProduct,
    addCategory,
    removeCategory,
    updateCategory,
    reorderCategories,
    showPrice,
    toggleShowPrice,
    bioConfig,
    updateBioConfig,
    donationConfig,
    updateDonationConfig,
    livePreviewData,
  };
}
