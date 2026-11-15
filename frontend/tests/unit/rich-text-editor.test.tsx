// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/vi.json";
import { useRichTextEditor } from "@/shares/components/common/rich-text-editor/hooks/use-rich-text-editor";
import { RichTextEditor } from "@/shares/components/common/rich-text-editor/rich-text-editor";

afterEach(cleanup);

describe("RichTextEditor", () => {
  it("trả HTML khi nhập, loại script và đồng bộ dữ liệu ngoài mà không phát onChange", async () => {
    const changed = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useRichTextEditor({ value, onChange: changed, label: "Nội dung" }),
      { initialProps: { value: "<p>Ban đầu</p>" } },
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    act(() => {
      result.current?.commands.setContent(
        "<p><strong>Đã sửa</strong></p><script>alert(1)</script>",
      );
    });
    expect(changed).toHaveBeenLastCalledWith("<p><strong>Đã sửa</strong></p>");

    changed.mockClear();
    rerender({ value: "<p>Dữ liệu mới</p>" });
    await waitFor(() => expect(result.current?.getHTML()).toBe("<p>Dữ liệu mới</p>"));
    expect(changed).not.toHaveBeenCalled();
  });

  it("báo liên kết không an toàn bằng FieldError trong editor", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <RichTextEditor value="<p>Nội dung</p>" onChange={vi.fn()} label="Nội dung" />
      </NextIntlClientProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Áp dụng liên kết" })).toHaveProperty(
        "disabled",
        false,
      ),
    );
    await user.type(screen.getByRole("textbox", { name: "Liên kết" }), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "Áp dụng liên kết" }));

    expect(screen.getByRole("alert").textContent).toBe("Chỉ chấp nhận URL HTTP/HTTPS.");
    expect(screen.getByRole("textbox", { name: "Liên kết" }).getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("đổi disabled không phát sự kiện thay đổi nội dung", async () => {
    const changed = vi.fn();
    const { result, rerender } = renderHook(
      ({ disabled }) =>
        useRichTextEditor({ value: "<p>Xem</p>", onChange: changed, label: "Nội dung", disabled }),
      { initialProps: { disabled: true } },
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.isEditable).toBe(false);

    rerender({ disabled: false });
    await waitFor(() => expect(result.current?.isEditable).toBe(true));
    expect(changed).not.toHaveBeenCalled();
  });
});
