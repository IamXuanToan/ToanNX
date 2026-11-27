// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Link } from "@/i18n/navigation";
import commonVi from "@/messages/vi.json";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { Form } from "@/shares/components/common/form";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormPage } from "@/shares/components/common/form-page";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { Button } from "@/shares/components/ui/button";

let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/vi/quan-tri/he-thong/nguoi-dung/123",
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : href.pathname} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/vi/quan-tri/he-thong/nguoi-dung/123",
}));

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof IntersectionObserver;
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
  }
});

afterEach(() => {
  cleanup();
  mockSearchParamsString = "";
});

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walkFiles(full) : [full];
  });
}

describe("Chuẩn hóa vị trí và tên nút Quay lại trên mọi header FormPage", () => {
  it("chế độ chỉ xem: nút [Quay lại] đứng TRÁI nút [Sửa] và không có mũi tên quay lại", () => {
    mockSearchParamsString = "";
    render(
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={commonVi}>
        <EditModeProvider canEdit>
          <FormPage title="Chi tiết bản ghi">
            <Form onSubmit={vi.fn()}>
              <FormActions>
                <Button asChild variant="outline">
                  <Link href={"/vi/quan-tri" as never}>Quay lại</Link>
                </Button>
              </FormActions>
            </Form>
          </FormPage>
        </EditModeProvider>
      </NextIntlClientProvider>,
    );

    const backLink = screen.getByRole("link", { name: "Quay lại" });
    const editButton = screen.getByRole("button", { name: "Sửa" });
    expect(screen.queryByTestId("page-back")).toBeNull();
    expect(
      Boolean(backLink.compareDocumentPosition(editButton) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
  });

  it("chế độ sửa (?mode=edit): giữ nguyên [Quay lại] đứng TRÁI nút [Lưu] và ẩn nút [Sửa]", () => {
    mockSearchParamsString = "mode=edit";
    render(
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={commonVi}>
        <EditModeProvider canEdit>
          <FormPage title="Chi tiết bản ghi">
            <Form onSubmit={vi.fn()}>
              <FormActions>
                <Button asChild variant="outline">
                  <Link href={"/vi/quan-tri" as never}>Quay lại</Link>
                </Button>
                <FormSubmitButton isSubmitting={false}>Lưu</FormSubmitButton>
              </FormActions>
            </Form>
          </FormPage>
        </EditModeProvider>
      </NextIntlClientProvider>,
    );

    const backLink = screen.getByRole("link", { name: "Quay lại" });
    const saveButton = screen.getByRole("button", { name: "Lưu" });
    expect(screen.queryByRole("button", { name: "Sửa" })).toBeNull();
    expect(
      Boolean(backLink.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
  });

  it("mọi Link điều hướng trong FormActions của các module đều dùng back ('Quay lại'), không dùng cancel ('Hủy')", () => {
    const modulesRoot = join(process.cwd(), "src", "modules");
    const files = walkFiles(modulesRoot).filter((f) => f.endsWith(".tsx"));
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (!content.includes("<FormActions")) continue;
      // Kiểm tra đoạn từ <FormActions tới </FormActions> không còn <Link ...>...("cancel")
      const blocks = content.match(/<FormActions[\s\S]*?<\/FormActions>/g) ?? [];
      for (const block of blocks) {
        if (/<Link[\s\S]*?\("cancel"\)[\s\S]*?<\/Link>/.test(block)) {
          offenders.push(relative(modulesRoot, file).replaceAll("\\", "/"));
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("trang có RecordDetailTabs + FormPage backHref luôn giữ nút Quay lại duy nhất bên trái Sửa khi chuyển sang tab ?tab=history", () => {
    mockSearchParamsString = "";
    render(
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={commonVi}>
        <EditModeProvider canEdit>
          <FormPage title="Nhắc việc test" backHref={"/vi/ca-nhan/nhac-viec" as never}>
            <RecordDetailTabs
              general={
                <Form onSubmit={vi.fn()}>
                  <FormActions>
                    <FormBackButton href={"/vi/ca-nhan/nhac-viec" as never} />
                  </FormActions>
                  <p>Nội dung chung</p>
                </Form>
              }
              history={<div data-testid="history-panel">Lịch sử thay đổi</div>}
            />
          </FormPage>
        </EditModeProvider>
      </NextIntlClientProvider>,
    );

    const backLinksGeneral = screen.getAllByRole("link", { name: "Quay lại" });
    expect(backLinksGeneral).toHaveLength(1);
    const editBtn = screen.getByRole("button", { name: "Sửa" });
    expect(
      Boolean(
        backLinksGeneral[0].compareDocumentPosition(editBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);

    const historyTab = screen.getByRole("tab", { name: commonVi.common.tabs.history });
    fireEvent.pointerDown(historyTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(historyTab, { button: 0, ctrlKey: false });
    fireEvent.click(historyTab);

    expect(screen.getByTestId("history-panel")).toBeTruthy();
    const backLinksHistory = screen.getAllByRole("link", { name: "Quay lại" });
    expect(backLinksHistory).toHaveLength(1);
    expect(backLinksHistory[0].getAttribute("href")).toBe("/vi/ca-nhan/nhac-viec");
  });

  it("quy ước module: mọi component dùng RecordDetailTabs phải truyền backHref lên FormPage", () => {
    const modulesRoot = join(process.cwd(), "src/modules");
    const files = walkFiles(modulesRoot).filter((f) => f.endsWith(".tsx"));
    const missingBackHref: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (!content.includes("<RecordDetailTabs")) continue;
      if (!/<FormPage[\s\S]*?backHref=/.test(content)) {
        missingBackHref.push(relative(modulesRoot, file).replaceAll("\\", "/"));
      }
    }

    expect(missingBackHref).toEqual([]);
  });

  it("quy ước trang chi tiết [id]: mọi trang chi tiết của model dùng JournalTracker (Admin & Portal) đều gắn RecordHistoryView", () => {
    const appRoot = join(process.cwd(), "src/app");
    const journalDetailPages = [
      "[locale]/(admin)/admin/authors/[id]/page.tsx",
      "[locale]/(admin)/admin/chapters/[id]/page.tsx",
      "[locale]/(admin)/admin/currencies/[id]/page.tsx",
      "[locale]/(admin)/admin/finance/incomes/[id]/page.tsx",
      "[locale]/(admin)/admin/finance/invoices/[id]/page.tsx",
      "[locale]/(admin)/admin/finance/platforms/[id]/page.tsx",
      "[locale]/(admin)/admin/genres/[id]/page.tsx",
      "[locale]/(admin)/admin/novels/[id]/page.tsx",
      "[locale]/(admin)/admin/page-paths/[id]/page.tsx",
      "[locale]/(admin)/admin/pages/[id]/page.tsx",
      "[locale]/(admin)/admin/qr-codes/[id]/page.tsx",
      "[locale]/(admin)/admin/roles/[id]/page.tsx",
      "[locale]/(admin)/admin/short-links/[id]/page.tsx",
      "[locale]/(admin)/admin/tags/[id]/page.tsx",
      "[locale]/(admin)/admin/users/[id]/page.tsx",
      "[locale]/(client)/portal/assets/[id]/page.tsx",
      "[locale]/(client)/portal/finance/incomes/[id]/page.tsx",
      "[locale]/(client)/portal/finance/invoices/[id]/page.tsx",
      "[locale]/(client)/portal/finance/platforms/[id]/page.tsx",
      "[locale]/(client)/portal/pages/[id]/page.tsx",
      "[locale]/(client)/portal/qr-codes/[id]/page.tsx",
      "[locale]/(client)/portal/reminders/[id]/page.tsx",
      "[locale]/(client)/portal/short-links/[id]/page.tsx",
      "[locale]/(client)/portal/subscriptions/[id]/page.tsx",
      "[locale]/(client)/portal/vault/[id]/page.tsx",
      "[locale]/(client)/portal/warranty-claims/[id]/page.tsx",
    ];

    const missingHistory = journalDetailPages.filter((pagePath) => {
      const content = readFileSync(join(appRoot, pagePath), "utf8");
      return !content.includes("RecordHistoryView");
    });

    expect(missingHistory).toEqual([]);
  });
});
