// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/vi.json";
import { SearchInput } from "@/shares/components/common/search-input";

function Provider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="vi" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

afterEach(cleanup);

describe("SearchInput", () => {
  it("gõ không tìm; Enter mới áp dụng từ khóa đã trim", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<SearchInput value="" onValueChange={changed} placeholder="Tìm" />, {
      wrapper: Provider,
    });
    const input = screen.getByRole("searchbox");
    await user.type(input, "  người dùng  ");
    expect(changed).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(changed).toHaveBeenCalledExactlyOnceWith("người dùng");
    expect((input as HTMLInputElement).value).toBe("người dùng");
  });

  it("Enter trong IME không áp dụng; nút xóa bỏ cả bản nháp", () => {
    const changed = vi.fn();
    render(<SearchInput value="cũ" onValueChange={changed} placeholder="Tìm" />, {
      wrapper: Provider,
    });
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "mới" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button"));
    expect(changed).toHaveBeenCalledExactlyOnceWith("");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("đồng bộ lại khi từ khóa trên URL thay đổi", () => {
    const changed = vi.fn();
    const { rerender } = render(
      <SearchInput value="cũ" onValueChange={changed} placeholder="Tìm" />,
      { wrapper: Provider },
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bản nháp" } });
    rerender(<SearchInput value="từ URL" onValueChange={changed} placeholder="Tìm" />);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("từ URL");
    expect(changed).not.toHaveBeenCalled();
  });

  it("chặn gửi và báo lỗi khi vượt quá 5 từ hoặc 100 ký tự", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<SearchInput value="" onValueChange={changed} placeholder="Tìm" />, {
      wrapper: Provider,
    });
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.maxLength).toBe(100);
    await user.type(input, "Nguyễn Xuân Toàn kiểm thử 🚀");
    await user.keyboard("{Enter}");
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Từ khóa tối đa 5 từ và 100 ký tự.");

    fireEvent.change(input, { target: { value: "a".repeat(101) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(changed).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Nguyễn Xuân Toàn" } });
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(changed).toHaveBeenCalledExactlyOnceWith("Nguyễn Xuân Toàn");
  });
});
