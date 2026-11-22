// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/vi.json";
import { TableRowActions } from "@/shares/components/common/table-row-actions";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

function Provider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="vi" messages={messages}>
      <TooltipProvider>{children}</TooltipProvider>
    </NextIntlClientProvider>
  );
}

const button = (key: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-action="${key}"]`);

afterEach(cleanup);

describe("TableRowActions", () => {
  it("luôn hiện Xem → Sửa → Xoá theo đúng thứ tự", () => {
    render(
      <TableRowActions row={{ id: 1 }} onView={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper: Provider },
    );
    const keys = [...document.querySelectorAll("button[data-action]")].map((node) =>
      node.getAttribute("data-action"),
    );
    expect(keys).toEqual(["view", "edit", "delete"]);
  });

  it("thiếu quyền: nút vẫn hiện nhưng khoá, bấm không gọi handler; Xem vẫn bấm được", () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <TableRowActions
        row={{ id: 1 }}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        can={{ update: false, delete: false }}
      />,
      { wrapper: Provider },
    );
    expect(button("edit")?.disabled).toBe(true);
    expect(button("delete")?.disabled).toBe(true);
    fireEvent.click(button("edit")!);
    fireEvent.click(button("delete")!);
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(button("view")!);
    expect(onView).toHaveBeenCalledOnce();
  });

  it("dòng không cho xoá (ví dụ chính mình): nút Xoá khoá dù có quyền", () => {
    render(
      <TableRowActions row={{ id: 1 }} onView={vi.fn()} onDelete={vi.fn()} canDelete={false} />,
      { wrapper: Provider },
    );
    expect(button("delete")?.disabled).toBe(true);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
