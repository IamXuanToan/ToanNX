// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/vi.json";
import { TiptapContent } from "@/shares/components/common/tiptap-content/tiptap-content";
import { useTiptapEditor } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-editor";
import { isAllowedLink } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-toolbar";
import { TiptapEditor } from "@/shares/components/common/tiptap-editor/tiptap-editor";

afterEach(cleanup);

const DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Ban đầu" }] }],
};

describe("TiptapEditor", () => {
  it("trả JSON khi sửa và nạp giá trị ngoài mà không phát onChange", async () => {
    const changed = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useTiptapEditor({ value, onChange: changed, label: "Nội dung" }),
      { initialProps: { value: DOC } },
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    act(() => {
      result.current?.commands.setContent(
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
    await waitFor(() => expect(JSON.stringify(result.current?.getJSON())).toContain("Từ server"));
    expect(changed).not.toHaveBeenCalled();
  });

  it("ảnh từ Thư viện giữ attachmentId trong JSON", async () => {
    const changed = vi.fn();
    const { result } = renderHook(() =>
      useTiptapEditor({ value: DOC, onChange: changed, label: "x" }),
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    act(() => {
      result.current
        ?.chain()
        .insertContent({
          type: "image",
          attrs: { src: "https://a/b.png", alt: "QR", attachmentId: "abc" },
        })
        .run();
    });
    expect(JSON.stringify(changed.mock.calls.at(-1)?.[0])).toContain('"attachmentId":"abc"');
  });

  it("toolbar có nhãn truy cập và chỉ nhận liên kết an toàn", () => {
    render(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <TiptapEditor value={DOC} onChange={() => {}} label="Nội dung trang" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("toolbar", { name: "Nội dung trang" })).toBeTruthy();
    expect(isAllowedLink("https://toannx.com")).toBe(true);
    expect(isAllowedLink("mailto:a@b.c")).toBe(true);
    expect(isAllowedLink("javascript:alert(1)")).toBe(false);
  });
});

describe("TiptapContent", () => {
  it("render JSON ở chế độ chỉ đọc (không cần DOM editor)", () => {
    render(<TiptapContent content={DOC} />);
    expect(screen.getByText("Ban đầu")).toBeTruthy();
  });
});
