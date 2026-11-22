// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import messages from "@/messages/vi.json";
import { SlugInput } from "@/shares/components/common/slug-input";
import { MoneyInput } from "@/shares/components/common/money-input";
import { NumberInput } from "@/shares/components/common/number-input";
import { formatDisplayMoney } from "@/shares/lib/number-format";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { EmailInput } from "@/shares/components/common/email-input";
import { PasswordInput } from "@/shares/components/common/password-input";
import { emailField, moneyField, slugField } from "@/shares/lib/field-schemas";
import { useStoredPreference } from "@/shares/hooks/use-stored-preference";
const provider = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="vi" messages={messages}>
    {children}
  </NextIntlClientProvider>
);
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function SlugHarness({ changed }: { changed: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <SlugInput
      aria-label="Slug"
      value={value}
      onChange={(next) => {
        setValue(next);
        changed(next);
      }}
    />
  );
}
describe("common input contracts", () => {
  it("giữ bộ gõ tiếng Việt trong composition, chuẩn hóa khi hoàn tất và blur", () => {
    const changed = vi.fn();
    render(<SlugHarness changed={changed} />, { wrapper: provider });
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "Đường dẫn tiếng Việt" } });
    expect(changed).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe("Đường dẫn tiếng Việt");
    fireEvent.compositionEnd(input, { data: "Đường dẫn tiếng Việt" });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe("duong-dan-tieng-viet");
    expect(changed).toHaveBeenLastCalledWith("duong-dan-tieng-viet");
  });
  it.each(["VND", "USD"] as const)(
    "nhập %s và trả giá trị mới nhất trước blur",
    async (currency) => {
      const user = userEvent.setup();
      const changed = vi.fn();
      render(<MoneyInput currency={currency} aria-label="Tiền" onChange={changed} />);
      await user.type(screen.getByRole("textbox"), currency === "USD" ? "1234.56" : "1234");
      expect(changed).toHaveBeenLastCalledWith(currency === "USD" ? 1234.56 : 1234);
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
        currency === "USD" ? "1,234.56 USD" : "1.234 VND",
      );
    },
  );
  it("input số cập nhật ngay, giữ phần lẻ và xử lý tăng bằng bàn phím", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();

    function Harness() {
      const [value, setValue] = useState<number | "">("");

      return (
        <NumberInput
          aria-label="Số lượng"
          value={value}
          step={0.5}
          onChange={(next) => {
            setValue(next);
            changed(next);
          }}
        />
      );
    }

    render(<Harness />, { wrapper: provider });
    const input = screen.getByRole("textbox");
    await user.type(input, "1250,5");
    expect((input as HTMLInputElement).value).toBe("1.250,5");
    expect(changed).toHaveBeenLastCalledWith(1250.5);
    await user.keyboard("{ArrowUp}");
    expect(changed).toHaveBeenLastCalledWith(1251);
    expect(formatDisplayMoney(12.34, { currency: "USD", locale: "en-US" })).toBe("$12.34");
    expect(formatDisplayMoney(1234, { currency: "VND" })).toContain("1.234");
  });

  it("lỗi email dùng FieldError và liên kết aria; Form luôn tắt native popup", async () => {
    const saved = vi.fn();
    const schema = z.object({ email: emailField("Email chưa hợp lệ") });
    function Harness() {
      const form = useForm({ defaultValues: { email: "" }, resolver: zodResolver(schema) });
      return (
        <Form aria-label="Form" noValidate={false} onSubmit={form.handleSubmit(saved)}>
          <FormField control={form.control} name="email" label="Email">
            {(field) => <EmailInput {...field} />}
          </FormField>
          <button type="submit">Lưu</button>
        </Form>
      );
    }
    const user = userEvent.setup();
    render(<Harness />, { wrapper: provider });
    await user.type(screen.getByLabelText("Email"), "bad-email");
    await user.click(screen.getByText("Lưu"));
    expect(screen.getByRole("alert").textContent).toBe("Email chưa hợp lệ");
    expect(saved).not.toHaveBeenCalled();
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    expect((screen.getByRole("form") as HTMLFormElement).noValidate).toBe(true);
  });
  it("schema tiền/slugs chung giữ đúng hợp đồng backend", () => {
    expect(moneyField("VND", "Lỗi").safeParse(1.5).success).toBe(false);
    expect(moneyField("USD", "Lỗi").safeParse(12.34).success).toBe(true);
    expect(moneyField("USD", "Lỗi").safeParse(-1).success).toBe(false);
    expect(moneyField("USD", "Lỗi").safeParse(1.234).success).toBe(false);
    expect(slugField("Lỗi").parse("Đường dẫn")).toBe("duong-dan");
    expect(slugField("Lỗi").safeParse("ab").success).toBe(false);
  });
  it("nhớ cấu hình từng bảng và khôi phục sau remount, bỏ qua storage hỏng", () => {
    const valid = (value: unknown): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === "string");
    const a = renderHook(() => useStoredPreference("data-table:users:pins", [], valid));
    const b = renderHook(() => useStoredPreference("data-table:roles:pins", [], valid));
    act(() => a.result.current[1](["email"]));
    expect(a.result.current[0]).toEqual(["email"]);
    expect(b.result.current[0]).toEqual([]);
    a.unmount();
    const restored = renderHook(() => useStoredPreference("data-table:users:pins", [], valid));
    expect(restored.result.current[0]).toEqual(["email"]);
    localStorage.setItem("bad", "{");
    const bad = renderHook(() => useStoredPreference("bad", [], valid));
    expect(bad.result.current[0]).toEqual([]);
  });
  it("PasswordInput chuẩn: ẩn/hiện mật khẩu khi bấm nút và cập nhật aria-pressed", async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Mật khẩu" />, { wrapper: provider });
    const input = screen.getByLabelText("Mật khẩu") as HTMLInputElement;
    expect(input.type).toBe("password");
    const toggle = screen.getByRole("button", { name: "Hiện mật khẩu" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await user.click(toggle);
    expect(input.type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toBeDefined();
    await user.click(toggle);
    expect(input.type).toBe("password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });
});
