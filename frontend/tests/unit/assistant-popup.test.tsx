// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import systemVi from "@/modules/system/messages/vi.json";
import { AssistantFloatingWidget } from "@/modules/workspace/components/assistant/assistant-floating-widget";
import {
  ASSISTANT_POPUP_SIZE_KEY,
  ASSISTANT_WIDGET_POSITION_KEY,
} from "@/modules/workspace/constants/defaults";
import workspaceVi from "@/modules/workspace/messages/vi.json";

const mockChat = vi.fn().mockResolvedValue({
  conversationId: "conv-1",
  reply: "Hôm nay bạn có 1 việc.",
  modelUsed: "cohere/command-a-plus",
  tokensUsed: 120,
  containsPrivateData: false,
  isFallback: false,
  fallbackAttempts: 1,
  fallbackCode: "",
  message: {
    id: "m-2",
    conversationId: "conv-1",
    role: "ASSISTANT",
    senderTelegramId: null,
    senderName: "ToanNX Bot",
    content: "Hôm nay bạn có 1 việc.",
    toolCalls: [],
    toolCallId: "",
    modelUsed: "cohere/command-a-plus",
    tokensUsed: 120,
    containsPrivateData: false,
    isError: false,
    createdAt: "2026-11-26T10:00:00Z",
  },
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    data: {
      user: {
        id: "u1",
        email: "member@toannx.local",
        fullName: "Nguyễn Toàn",
        avatar: null,
      },
      permissions: ["workspace.assistant.chat"],
    },
  }),
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: () => true,
}));

vi.mock("@/modules/workspace/services/assistant.service", () => ({
  assistantService: { chat: (...args: unknown[]) => mockChat(...args) },
}));

vi.mock("@/modules/workspace/services/assistant-config.service", () => ({
  assistantConfigService: {
    getBotProfile: vi.fn().mockResolvedValue({
      name: "ToanNX Bot",
      avatar: null,
      activeModel: "cohere/command-a-plus",
      hasCustomPolicy: true,
    }),
    getThread: vi.fn().mockResolvedValue({
      messages: [],
      hasMoreMessages: false,
      totalMessages: 0,
    }),
    clearThread: vi.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale="vi"
        timeZone="Asia/Ho_Chi_Minh"
        messages={{ ...commonVi, system: systemVi, workspace: workspaceVi }}
      >
        {node}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Object.defineProperty(window, "innerWidth", { value: 1280, configurable: true, writable: true });
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true, writable: true });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("AssistantFloatingWidget (Nút tròn kéo-thả & Popup bung thông minh)", () => {
  it("render nút tròn Avatar/Bot, không có nút cấu hình user, mở popup hướng lên trên trái ở góc phải dưới", async () => {
    wrap(<AssistantFloatingWidget />);

    const trigger = await screen.findByTestId("assistant-floating-trigger");
    expect(trigger.className).toContain("rounded-full");

    // Click nút tròn (không kéo) -> mở popup bung ra phía trên-trái
    fireEvent.pointerDown(trigger, { pointerId: 1, button: 0, clientX: 1220, clientY: 740 });
    fireEvent.pointerUp(trigger, { pointerId: 1, button: 0, clientX: 1220, clientY: 740 });

    const panel = await screen.findByTestId("assistant-popup-panel");
    expect(panel.getAttribute("data-placement")).toBe("top-left");
    expect(panel.textContent).toContain("ToanNX Bot");

    // User Portal không còn nút mở config, lịch sử luồng hay nhãn kỹ thuật model/tokens
    expect(screen.queryByTestId("assistant-popup-config")).toBeNull();
    expect(screen.queryByTestId("assistant-popup-threads")).toBeNull();
    expect(panel.textContent).not.toContain("cohere/command-a-plus");
    expect(panel.textContent).not.toContain("Policy");

    // Đổi kích thước popup Nhỏ / Vừa / Lớn và lưu localStorage
    const sizeLarge = screen.getByTestId("assistant-size-large");
    fireEvent.click(sizeLarge);
    expect(sizeLarge.getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem(ASSISTANT_POPUP_SIZE_KEY)).toBe('"large"');
    expect(panel.style.width).toBe("540px");

    // Bấm badge lệnh nhanh thân thiện ("Hôm nay") vẫn gửi `/hom_nay`
    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
    await waitFor(() => {
      expect(mockChat).toHaveBeenCalledWith({ message: "/hom_nay" });
    });

    fireEvent.click(screen.getByTestId("assistant-popup-close"));
    expect(screen.queryByTestId("assistant-popup-panel")).toBeNull();
  });

  it("kéo thả nút tròn ra giữa màn hình sẽ tự động hít sát vào cạnh gần nhất trong 4 cạnh", async () => {
    wrap(<AssistantFloatingWidget />);
    const trigger = await screen.findByTestId("assistant-floating-trigger");

    // Kéo từ phải-dưới (1216, 736) lên vùng gần mép trên nhưng giữa theo chiều ngang (~(500, 90))
    fireEvent.pointerDown(trigger, { pointerId: 4, button: 0, clientX: 1216, clientY: 736 });
    fireEvent.pointerMove(trigger, { pointerId: 4, clientX: 500, clientY: 90 });
    fireEvent.pointerUp(trigger, { pointerId: 4, button: 0, clientX: 500, clientY: 90 });

    const savedRaw = window.localStorage.getItem(ASSISTANT_WIDGET_POSITION_KEY);
    expect(savedRaw).toBeTruthy();
    const savedRatio = JSON.parse(savedRaw as string) as { xRatio: number; yRatio: number };
    expect(savedRatio.yRatio).toBe(0);
    expect(trigger.style.top).toBe("76px");
  });

  it("kéo thả nút tròn lên góc trên-trái sẽ lưu vị trí và tự động bung popup xuống dưới-phải", async () => {
    wrap(<AssistantFloatingWidget />);
    const trigger = await screen.findByTestId("assistant-floating-trigger");

    // Kéo mạnh về góc trên-trái (delta lớn từ phải-dưới lên (-1200, -700))
    fireEvent.pointerDown(trigger, { pointerId: 2, button: 0, clientX: 1220, clientY: 740 });
    fireEvent.pointerMove(trigger, { pointerId: 2, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(trigger, { pointerId: 2, button: 0, clientX: 20, clientY: 20 });

    // Không tự bật popup khi vừa kéo xong; vị trí đã lưu vào localStorage (không tiền tố toannx)
    expect(screen.queryByTestId("assistant-popup-panel")).toBeNull();
    const saved = window.localStorage.getItem(ASSISTANT_WIDGET_POSITION_KEY);
    expect(saved).toBeTruthy();
    expect(ASSISTANT_WIDGET_POSITION_KEY).not.toContain("toannx");

    // Bấm lại nút tròn sau khi kéo -> popup tự động bung xuống dưới-phải ("bottom-right")
    fireEvent.pointerDown(trigger, { pointerId: 3, button: 0, clientX: 30, clientY: 30 });
    fireEvent.pointerUp(trigger, { pointerId: 3, button: 0, clientX: 30, clientY: 30 });

    const panel = await screen.findByTestId("assistant-popup-panel");
    expect(panel.getAttribute("data-placement")).toBe("bottom-right");
  });
});
