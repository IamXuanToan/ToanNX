// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AssistantQuickReplies } from "@/modules/workspace/components/assistant/assistant-quick-replies";
import { AssistantResultCard } from "@/modules/workspace/components/assistant/assistant-result-card";
import workspaceVi from "@/modules/workspace/messages/vi.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (msg: string) => toastSuccess(msg) } }));

function renderWithIntl(node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="vi" messages={{ workspace: workspaceVi }}>
      {node}
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AssistantQuickReplies", () => {
  it("gửi đúng nội dung lựa chọn khi bấm nút", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <AssistantQuickReplies
        replies={[
          { caption: "Chờ bấm nút", text: "Chờ bấm nút" },
          { caption: "Chuyển ngay (1 giây)", text: "Chuyển ngay (1 giây)" },
        ]}
        disabled={false}
        label="Lựa chọn"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Chuyển ngay (1 giây)" }));
    expect(onSelect).toHaveBeenCalledWith("Chuyển ngay (1 giây)");
  });

  it("không hiển thị gì khi không có lựa chọn và khóa nút khi đang gửi", () => {
    const { container, rerender } = renderWithIntl(
      <AssistantQuickReplies replies={[]} disabled={false} label="Lựa chọn" onSelect={vi.fn()} />,
    );
    expect(container.querySelector("[data-testid='assistant-quick-replies']")).toBeNull();
    rerender(
      <NextIntlClientProvider locale="vi" messages={{ workspace: workspaceVi }}>
        <AssistantQuickReplies
          replies={[{ caption: "Không đặt mật khẩu", text: "Không đặt mật khẩu" }]}
          disabled
          label="Lựa chọn"
          onSelect={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    expect(
      (screen.getByRole("button", { name: "Không đặt mật khẩu" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe("AssistantQuickReplies – ô nhập trực tiếp", () => {
  it("gửi số kèm đơn vị và chặn giá trị không hợp lệ", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <AssistantQuickReplies
        replies={[{ caption: "Trước 5 phút", text: "Trước 5 phút" }]}
        input={{ kind: "number", unit: "phút", placeholder: "Số phút khác" }}
        disabled={false}
        label="Lựa chọn"
        onSelect={onSelect}
      />,
    );
    const field = screen.getByLabelText("Số phút khác") as HTMLInputElement;
    const send = screen.getByRole("button", { name: "Gửi" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(field, { target: { value: "10" } });
    fireEvent.click(send);
    expect(onSelect).toHaveBeenCalledWith("10 phút", { secret: false });
    expect(field.value).toBe("");
  });

  it("ô mật khẩu ẩn ký tự, bật/tắt hiển thị và đánh dấu secret khi gửi", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <AssistantQuickReplies
        replies={[]}
        input={{ kind: "secret", unit: "", placeholder: "Nhập mật khẩu…" }}
        disabled={false}
        label="Lựa chọn"
        onSelect={onSelect}
      />,
    );
    const field = screen.getByLabelText("Nhập mật khẩu…") as HTMLInputElement;
    expect(field.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(field.type).toBe("text");
    fireEvent.change(field, { target: { value: "BiMat#1" } });
    fireEvent.submit(screen.getByTestId("assistant-quick-input"));
    expect(onSelect).toHaveBeenCalledWith("BiMat#1", { secret: true });
  });
});

describe("AssistantResultCard", () => {
  const card = {
    type: "short_link",
    kindLabel: "link rút gọn",
    action: "created",
    id: "l-1",
    title: "Facebook",
    url: "https://toannx.com/s/facebook",
    viewUrl: "https://toannx.com/vi/ca-nhan/link-rut-gon/l-1",
    destinationUrl: "https://www.facebook.com/",
    redirectMode: "Chờ bấm nút",
    hasPassword: false,
    expiresAt: null,
    status: "ACTIVE",
  };

  it("mở và sao chép đúng URL thật do server trả", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderWithIntl(<AssistantResultCard card={card} />);

    expect(screen.getByRole("link", { name: /Mở link/ }).getAttribute("href")).toBe(card.url);
    fireEvent.click(screen.getByRole("button", { name: /Sao chép link/ }));
    expect(writeText).toHaveBeenCalledWith(card.url);
    expect(toastSuccess).toHaveBeenCalledWith("Đã sao chép link");
  });

  it("thẻ bản ghi thường chỉ có nút Xem chi tiết tới trang Portal", () => {
    renderWithIntl(
      <AssistantResultCard
        card={{
          ...card,
          type: "reminder",
          kindLabel: "nhắc việc",
          title: "Họp team",
          url: "https://toannx.com/vi/ca-nhan/nhac-viec/r-1",
          viewUrl: "https://toannx.com/vi/ca-nhan/nhac-viec/r-1",
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: /Sao chép link/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Xem chi tiết/ }).getAttribute("href")).toBe(
      "https://toannx.com/vi/ca-nhan/nhac-viec/r-1",
    );
  });
});
