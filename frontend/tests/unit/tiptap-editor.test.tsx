// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import commonMessages from "@/messages/vi.json";
import utilitiesMessages from "@/modules/utilities/messages/vi.json";
import { TiptapBasicEditor } from "@/shares/components/common/tiptap-basic-editor";
import { TiptapCommentEditor } from "@/shares/components/common/tiptap-comment-editor";
import { TiptapContent } from "@/shares/components/common/tiptap-content";
import { moveTopLevelBlock } from "@/shares/components/common/hooks/use-tiptap-block-handle";
import { useTiptapCommentEditor } from "@/shares/components/common/hooks/use-tiptap-comment-editor";
import { useTiptapEditor } from "@/shares/components/common/hooks/use-tiptap-editor";
import { isAllowedLink } from "@/shares/components/common/hooks/use-tiptap-toolbar";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor";
import {
  formatTiptapImageWidth,
  getTiptapImageWrapperAlignClass,
} from "@/shares/components/common/tiptap-extensions";
import { LegacyTiptapPageRenderer } from "@/modules/utilities/components/page/legacy-tiptap-page-renderer";
import { createNotionDemoSampleDoc } from "@/modules/utilities/constants/notion-demo-data";
import { NotionDemoShowcase } from "@/modules/utilities/components/page/notion-demo-showcase";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: unknown; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "/demo"} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const ALL_MESSAGES = {
  ...commonMessages,
  utilities: utilitiesMessages,
};

const DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Ban đầu" }] }],
};

describe("TiptapEditor", () => {
  it("trả JSON khi sửa và nạp giá trị ngoài mà không phát onChange", async () => {
    const changed = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useTiptapEditor({ value, onChange: changed, label: "Nội dung" }),
      {
        initialProps: { value: DOC },
        wrapper: ({ children }) => (
          <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
            {children}
          </NextIntlClientProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());

    act(() => {
      result.current.editor?.commands.setContent(
        "<p><strong>Đã sửa</strong></p><script>alert(1)</script>",
      );
    });
    const json = changed.mock.calls.at(-1)?.[0];
    expect(json.type).toBe("doc");
    expect(JSON.stringify(json)).toContain("Đã sửa");
    expect(JSON.stringify(json)).not.toContain("script");

    changed.mockClear();
    rerender({
      value: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Từ server" }] }],
      },
    });
    await waitFor(() =>
      expect(JSON.stringify(result.current.editor?.getJSON())).toContain("Từ server"),
    );
    expect(changed).not.toHaveBeenCalled();
  });

  it("ảnh từ Thư viện giữ attachmentId, width và align trong JSON", async () => {
    const changed = vi.fn();
    const { result } = renderHook(
      () => useTiptapEditor({ value: DOC, onChange: changed, label: "x" }),
      {
        wrapper: ({ children }) => (
          <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
            {children}
          </NextIntlClientProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    act(() => {
      result.current.editor
        ?.chain()
        .insertContent({
          type: "image",
          attrs: {
            src: "https://a/b.png",
            alt: "QR",
            attachmentId: "abc",
            width: "50%",
            align: "center",
          },
        })
        .run();
    });
    const serialized = JSON.stringify(changed.mock.calls.at(-1)?.[0]);
    expect(serialized).toContain('"attachmentId":"abc"');
    expect(serialized).toContain('"width":"50%"');
    expect(serialized).toContain('"align":"center"');
  });

  it("toolbar sticky có nhãn truy cập, chỉ nhận liên kết an toàn và không kích hoạt submit form cha khi chèn URL", () => {
    const parentSubmitted = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <form onSubmit={parentSubmitted}>
          <TiptapEditor value={DOC} onChange={() => {}} label="Nội dung trang" />
        </form>
      </NextIntlClientProvider>,
    );

    const toolbar = screen.getByRole("toolbar", { name: "Nội dung trang" });
    expect(toolbar.className).toContain("sticky");
    expect(isAllowedLink("https://toannx.com")).toBe(true);
    expect(isAllowedLink("mailto:a@b.c")).toBe(true);
    expect(isAllowedLink("javascript:alert(1)")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Chèn ảnh từ URL" }));
    fireEvent.change(screen.getByPlaceholderText("https://"), {
      target: { value: "https://example.com/photo.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(parentSubmitted).not.toHaveBeenCalled();
  });

  it("hỗ trợ ẩn toolbar (chế độ Notion thuần) và bật thống kê chân trang khi showStats=true", () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <TiptapEditor
          value={DOC}
          onChange={() => {}}
          label="Bài viết"
          showToolbar={false}
          showStats
        />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("toolbar", { name: "Bài viết" })).toBeNull();
    expect(screen.getByText(/1 khối/)).toBeTruthy();

    rerender(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <TiptapEditor
          value={DOC}
          onChange={() => {}}
          label="Bài viết"
          showToolbar
          showStats={false}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("toolbar", { name: "Bài viết" })).toBeTruthy();
    expect(screen.queryByText(/1 khối/)).toBeNull();
  });

  it("moveTopLevelBlock kéo thả đổi thứ tự block lên/xuống đúng vị trí và bỏ qua no-op", async () => {
    const threeBlocks = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Khối một" }] },
        { type: "paragraph", content: [{ type: "text", text: "Khối hai" }] },
        { type: "paragraph", content: [{ type: "text", text: "Khối ba" }] },
      ],
    };
    const { result } = renderHook(
      () => useTiptapEditor({ value: threeBlocks, onChange: () => {}, label: "Sắp xếp" }),
      {
        wrapper: ({ children }) => (
          <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
            {children}
          </NextIntlClientProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    const editor = result.current.editor!;

    expect(moveTopLevelBlock(editor, 0, 0)).toBe(false);
    expect(moveTopLevelBlock(editor, 0, 1)).toBe(false);

    const readBlockTexts = () =>
      Array.from(
        { length: editor.state.doc.childCount },
        (_, idx) => editor.state.doc.child(idx).textContent,
      );

    act(() => {
      expect(moveTopLevelBlock(editor, 0, 3)).toBe(true);
    });
    expect(readBlockTexts()).toEqual(["Khối hai", "Khối ba", "Khối một"]);

    act(() => {
      expect(moveTopLevelBlock(editor, 2, 0)).toBe(true);
    });
    expect(readBlockTexts()).toEqual(["Khối một", "Khối hai", "Khối ba"]);
  });
});

describe("TiptapContent & Image helpers", () => {
  it("render JSON ở chế độ chỉ đọc (không cần DOM editor) và bảo toàn kích thước, căn lề ảnh", () => {
    expect(formatTiptapImageWidth("50%", "center")).toBe("50%");
    expect(formatTiptapImageWidth(360, "left")).toBe("360px");
    expect(formatTiptapImageWidth("bad;css", "left")).toBeUndefined();
    expect(formatTiptapImageWidth("25%", "full")).toBe("100%");
    expect(getTiptapImageWrapperAlignClass("center")).toBe("justify-center");
    expect(getTiptapImageWrapperAlignClass("right")).toBe("justify-end");

    const docWithImage = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Ban đầu" }] },
        {
          type: "image",
          attrs: {
            src: "https://example.com/demo.png",
            alt: "Ảnh mô tả",
            width: "50%",
            align: "center",
          },
        },
      ],
    };
    const { container } = render(<TiptapContent content={docWithImage} />);
    expect(screen.getByText("Ban đầu")).toBeTruthy();
    expect(screen.getByText("Ảnh mô tả")).toBeTruthy();
    const figure = container.querySelector("figure");
    expect(figure?.className).toContain("justify-center");
    const box = figure?.firstElementChild as HTMLElement | null;
    expect(box?.style.width).toBe("50%");
  });

  it("callout/button trong TiptapContent dùng cùng token màu hệ thống với Editor và LegacyTiptapPageRenderer không bị ghi đè theme cũ", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "callout",
          attrs: { tone: "info" },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Ghi chú" }] }],
        },
        {
          type: "button",
          attrs: { label: "Nút mẫu", href: "https://toannx.com", variant: "primary" },
        },
      ],
    };

    const { container } = render(
      <LegacyTiptapPageRenderer
        page={{
          id: "legacy-1",
          segment: "p",
          status: "PUBLISHED",
          preview: false,
          canonicalUrl: "https://toannx.com/p/trang-tu-do",
          avatarUrl: null,
          coverUrl: null,
          title: "Trang tự do",
          slug: "trang-tu-do",
          description: "",
          seoTitle: "",
          seoDescription: "",
          pageType: "LEGACY_PAGE",
          templateKey: "blank",
          templateVersion: 1,
          contentConfig: {},
          styleConfig: {},
          responsiveConfig: {},
          theme: {
            mode: "dark",
            primaryColor: "#0284c7",
            backgroundColor: "#000000",
            textColor: "#ffffff",
            buttonStyle: "pill",
          },
          content: doc,
        }}
      />,
    );

    const main = container.querySelector("main") as HTMLElement;
    expect(main.style.getPropertyValue("--page-primary")).toBe("");
    expect(main.style.backgroundColor).toBe("");
    expect(main.className).toContain("bg-background");

    const callout = container.querySelector('[data-type="callout"]') as HTMLElement;
    expect(callout.className).toContain("border-[var(--page-primary,var(--primary))]");
    expect(callout.className).toContain("bg-muted/70");

    const button = container.querySelector('a[data-type="button"]') as HTMLElement;
    expect(button.className).toContain("bg-[var(--page-primary,var(--primary))]");
    expect(button.className).toContain("text-primary-foreground");
    expect(button.className).not.toContain("rounded-full");
  });
});

describe("TiptapBasicEditor", () => {
  it("chỉ hiển thị In đậm, In nghiêng, Hoàn tác/Làm lại và bộ đếm ký tự", () => {
    render(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <TiptapBasicEditor value={DOC} onChange={() => {}} label="Mô tả ngắn" maxLength={300} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("toolbar", { name: "Mô tả ngắn" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đậm" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nghiêng" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hoàn tác" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Làm lại" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gạch chân" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Bảng" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Chèn ảnh từ URL" })).toBeNull();
    expect(screen.getByText(/300 ký tự/)).toBeTruthy();
  });
});

describe("TiptapCommentEditor", () => {
  it("vô hiệu nút gửi khi rỗng, hiển thị nhãn trả lời và gửi/xóa nội dung sau onSubmit", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <TiptapCommentEditor label="Viết bình luận" onSubmit={onSubmit} onCancel={onCancel} />
      </NextIntlClientProvider>,
    );

    const submitBtn = screen.getByRole("button", { name: "Gửi bình luận" }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    rerender(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <TiptapCommentEditor
          value={{
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Bình luận hay quá" }] },
            ],
          }}
          label="Viết bình luận"
          replyingTo="ToanNX"
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Đang trả lời ToanNX")).toBeTruthy();
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Gửi bình luận" }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi bình luận" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(JSON.stringify(onSubmit.mock.calls[0]?.[0])).toContain("Bình luận hay quá");

    const cancelButtons = screen.getAllByRole("button", { name: "Hủy" });
    fireEvent.click(cancelButtons[0]!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hỗ trợ phím tắt Ctrl+Enter để gửi nhanh trong hook bình luận", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(
      () =>
        useTiptapCommentEditor({
          label: "Bình luận nhanh",
          onSubmit,
          value: {
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Gửi bằng phím tắt" }] },
            ],
          },
        }),
      {
        wrapper: ({ children }) => (
          <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
            {children}
          </NextIntlClientProvider>
        ),
      },
    );
    await waitFor(() => {
      expect(result.current.editor).not.toBeNull();
      expect(result.current.isEmpty).toBe(false);
    });
    await act(async () => {
      await Promise.resolve();
    });
    const handled = result.current.editor!.options.editorProps?.handleKeyDown?.(
      result.current.editor!.view,
      new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, cancelable: true }),
    );
    expect(handled).toBe(true);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});

describe("NotionDemoShowcase", () => {
  it("render đủ 3 bộ Editor (Full, Basic, Comment) và chuyển tab mượt mà", () => {
    const sampleVi = createNotionDemoSampleDoc("vi");
    const sampleEn = createNotionDemoSampleDoc("en");
    expect(sampleVi.content?.some((n) => n.type === "image")).toBe(true);
    expect(sampleEn.content?.some((n) => n.type === "taskList")).toBe(true);

    const { container } = render(
      <NextIntlClientProvider locale="vi" messages={ALL_MESSAGES}>
        <NotionDemoShowcase />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Bản thử nghiệm Notion-like")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Xem trước" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Xem JSON" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "2. Bản Basic (Mô tả)" }));
    expect(container.querySelector('[data-slot="tiptap-basic-editor"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "3. Bản Comment (Bình luận)" }));
    expect(container.querySelector('[data-slot="tiptap-comment-editor"]')).toBeTruthy();
  });
});
