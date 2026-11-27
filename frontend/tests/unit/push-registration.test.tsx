// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePushRegistration } from "@/modules/system/components/push-device/hooks/use-push-registration";
import {
  PUSH_DEVICE_SYNC_STORAGE_KEY,
  PUSH_DEVICE_SYNC_TTL_MS,
} from "@/modules/system/constants/notification-polling";

const mockRegister = vi.fn();
const mockGetPushToken = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/shares/lib/firebase-messaging", () => ({
  isPushSupported: () => true,
  getPushToken: () => mockGetPushToken(),
}));

vi.mock("@/modules/system/services/push-device.service", () => ({
  pushDeviceService: {
    register: (...args: unknown[]) => mockRegister(...args),
  },
}));

describe("usePushRegistration chống gọi trùng POST /push-devices", () => {
  beforeEach(() => {
    localStorage.clear();
    mockRegister.mockReset().mockResolvedValue({ id: "dev-1" });
    mockGetPushToken.mockReset().mockResolvedValue("fcm-token-1");
    Object.defineProperty(globalThis, "Notification", {
      value: {
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function wrapper({ children }: { children: ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }

  it("chỉ đăng ký 1 lần khi mount lặp lại với cùng token trong TTL 24h và gọi lại khi đổi token/hết hạn", async () => {
    const first = renderHook(() => usePushRegistration(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);

    // LocalStorage không lưu raw FCM token
    const stored = localStorage.getItem(PUSH_DEVICE_SYNC_STORAGE_KEY) ?? "";
    expect(stored).not.toContain("fcm-token-1");

    // Unmount và mount lại ngay (mô phỏng F5 / chuyển layout) -> không gọi POST thừa
    first.unmount();
    const second = renderHook(() => usePushRegistration(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);

    // Đổi FCM token mới -> tự đăng ký lại ngay
    second.unmount();
    mockGetPushToken.mockResolvedValue("fcm-token-2");
    renderHook(() => usePushRegistration(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRegister).toHaveBeenCalledTimes(2);

    // Hết hạn TTL 24h -> tự đồng bộ lại ở lần mount kế tiếp
    const parsed = JSON.parse(localStorage.getItem(PUSH_DEVICE_SYNC_STORAGE_KEY) ?? "{}");
    parsed.syncedAt = Date.now() - PUSH_DEVICE_SYNC_TTL_MS - 1000;
    localStorage.setItem(PUSH_DEVICE_SYNC_STORAGE_KEY, JSON.stringify(parsed));

    renderHook(() => usePushRegistration(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRegister).toHaveBeenCalledTimes(3);
  });

  it("thao tác bấm nút enable() luôn cưỡng bức đồng bộ bất kể cache dedup", async () => {
    const { result } = renderHook(() => usePushRegistration(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.enable();
    });
    expect(mockRegister).toHaveBeenCalledTimes(2);
  });
});
