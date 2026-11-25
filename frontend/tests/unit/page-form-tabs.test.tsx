// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import commonMessages from "@/messages/vi.json";
import utilitiesMessages from "@/modules/utilities/messages/vi.json";
import { PageForm } from "@/modules/utilities/components/page/page-form";
import { PAGE_TYPE } from "@/modules/utilities/constants/page-constants";
import { PAGE_FORM_DEFAULTS, type PageFormValues } from "@/modules/utilities/schemas/page.schema";

const mockPageType = vi.hoisted(() => ({ current: "LEGACY_PAGE" as string }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: unknown; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "/"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/modules/system/views/attachment/attachment-image-upload-view", () => ({
  AttachmentImageUploadView: () => null,
}));
vi.mock("@/modules/system/views/attachment/attachment-tiptap-image-plugin", () => ({
  AttachmentTiptapImagePlugin: () => null,
}));
vi.mock("@/modules/utilities/views/qr-code/qr-code-tiptap-plugin", () => ({
  QrCodeTiptapPlugin: () => null,
}));
vi.mock("@/modules/utilities/views/short-link/short-link-tiptap-plugin", () => ({
  ShortLinkTiptapPlugin: () => null,
}));
vi.mock("@/shares/components/common/tiptap-editor", () => ({
  TiptapEditor: () => <div data-testid="mock-tiptap-editor" />,
}));
vi.mock("@/modules/utilities/components/page/page-preview-frame", () => ({
  PagePreviewFrame: () => <div data-testid="mock-preview-frame" />,
}));
vi.mock("@/modules/utilities/components/page/page-theme-editor", () => ({
  PageThemeEditor: () => <div data-testid="mock-theme-editor" />,
}));
vi.mock("@/modules/utilities/components/page/page-affiliate-items-editor", () => ({
  PageAffiliateItemsEditor: () => null,
}));
vi.mock("@/modules/utilities/components/page/page-affiliate-categories-editor", () => ({
  PageAffiliateCategoriesEditor: () => null,
}));
vi.mock("@/modules/utilities/components/page/page-bio-editor", () => ({
  PageBioEditor: () => null,
}));
vi.mock("@/modules/utilities/components/page/page-donation-editor", () => ({
  PageDonationEditor: () => null,
}));
vi.mock("@/modules/utilities/components/page/page-button-dialog", () => ({
  PageButtonDialog: () => null,
}));
vi.mock("@/modules/utilities/components/page/quick-add-modal", () => ({
  QuickAddModal: () => null,
}));
vi.mock("@/modules/utilities/components/page/page-path/page-path-select", () => ({
  PagePathSelect: () => null,
}));

vi.mock("@/modules/utilities/components/page/hooks/use-page-form", () => ({
  usePageForm: () => {
    const form = useForm<PageFormValues>({
      defaultValues: {
        ...PAGE_FORM_DEFAULTS,
        pageType: mockPageType.current as PageFormValues["pageType"],
      },
    });
    return {
      form,
      paths: { data: [], isPending: false },
      insertItems: [],
      onSubmit: (e: React.FormEvent) => e.preventDefault(),
      isSubmitting: false,
      conflict: false,
      reload: async () => {},
      draft: null,
      restoreDraft: () => {},
      discardDraft: () => {},
      buttonEditor: null,
      openButtonDialog: () => {},
      closeButtonDialog: () => {},
      pageType: mockPageType.current,
      templateKey: "blank",
      quickAddOpen: false,
      setQuickAddOpen: () => {},
      productModalMode: "manual" as const,
      setProductModalMode: () => {},
      editingProduct: null,
      setEditingProduct: () => {},
      openAddProduct: () => {},
      openQuickAdd: () => {},
      openEditProduct: () => {},
      previewDevice: "desktop" as const,
      setPreviewDevice: () => {},
      affiliateItems: [],
      affiliateCategories: [],
      addAffiliateProduct: () => {},
      removeAffiliateProduct: () => {},
      updateAffiliateProduct: () => {},
      reorderAffiliateProducts: () => {},
      importAffiliateProducts: () => {},
      addCategory: () => {},
      removeCategory: () => {},
      updateCategory: () => {},
      reorderCategories: () => {},
      showPrice: true,
      toggleShowPrice: () => {},
      bioConfig: {},
      updateBioConfig: () => {},
      donationConfig: {},
      updateDonationConfig: () => {},
      livePreviewData: {
        id: "p1",
        title: "Demo",
        slug: "demo",
        description: "",
        seoTitle: "",
        seoDescription: "",
        pageType: mockPageType.current,
        templateKey: "blank",
        templateVersion: 1,
        contentConfig: {},
        styleConfig: {},
        responsiveConfig: {},
        theme: { mode: "system" },
        content: { type: "doc", content: [{ type: "paragraph" }] },
      },
    };
  },
}));

afterEach(cleanup);

const ALL_MESSAGES = {
  ...commonMessages,
  utilities: utilitiesMessages,
};

function PageFormHarness() {
  const form = useForm<PageFormValues>({ defaultValues: PAGE_FORM_DEFAULTS });
  return (
    <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
      <FormProvider {...form}>
        <PageForm canCreatePath={false} canUpdatePath={false} />
      </FormProvider>
    </NextIntlClientProvider>
  );
}

describe("PageForm tabs theo loại trang", () => {
  it("ẩn tab Giao diện đối với trang soạn thảo tự do (LEGACY_PAGE)", () => {
    mockPageType.current = PAGE_TYPE.LEGACY_PAGE;
    render(<PageFormHarness />);

    expect(screen.getByRole("tab", { name: "Nội dung" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Cài đặt" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Giao diện" })).toBeNull();
    expect(screen.queryByTestId("mock-theme-editor")).toBeNull();
  });

  it("vẫn hiển thị tab Giao diện với trang mẫu (AFFILIATE)", () => {
    mockPageType.current = PAGE_TYPE.AFFILIATE;
    render(<PageFormHarness />);

    expect(screen.getByRole("tab", { name: "Sản phẩm & Link" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Giao diện" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Cài đặt" })).toBeTruthy();
  });
});
