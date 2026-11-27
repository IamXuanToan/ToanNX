// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  NOTIFICATION_POLL_WITHOUT_PUSH_MS,
  NOTIFICATION_POLL_WITH_PUSH_MS,
} from "@/modules/system/constants/notification-polling";
import { notificationKeys } from "@/modules/system/constants/query-keys";
import { useUnreadCount } from "@/modules/system/hooks/use-unread-count";

const mockUnreadCount = vi.fn();

vi.mock("@/modules/system/services/notification.service", () => ({
  notificationService: {
    unreadCount: (...args: unknown[]) => mockUnreadCount(...args),
  },
}));

describe("useUnreadCount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUnreadCount.mockReset().mockResolvedValue({ personal: 1, system: 0, total: 1 });
    focusManager.setFocused(true);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function createWrapper(qc: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    };
  }

  it("không poll khi tắt Push ở 6 phút mà đợi đủ 15 phút; có Push đợi đủ 30 phút", async () => {
    const qcNoPush = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useUnreadCount(true, false), { wrapper: createWrapper(qcNoPush) });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6 * 60_000);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_WITHOUT_PUSH_MS - 6 * 60_000 + 100);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(2);
    qcNoPush.clear();
    cleanup();

    // Chuyển sang có Push: đợi 15 phút chưa poll, đủ 30 phút mới poll
    mockUnreadCount.mockClear();
    const qcWithPush = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useUnreadCount(true, true), { wrapper: createWrapper(qcWithPush) });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60_000);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_WITH_PUSH_MS - 15 * 60_000 + 100);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(2);
  });

  it("refetchOnWindowFocus thông minh theo staleTime và FCM invalidate làm mới ngay", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useUnreadCount(true, false), { wrapper: createWrapper(qc) });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    // Đổi focus ngay sau 20s (chưa hết staleTime 2 phút) -> KHÔNG gọi lại API
    await act(async () => {
      focusManager.setFocused(false);
      await vi.advanceTimersByTimeAsync(20_000);
      focusManager.setFocused(true);
      await Promise.resolve();
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(1);

    // Sau 2 phút (đã stale) quay lại focus tab -> refetch 1 lần
    await act(async () => {
      focusManager.setFocused(false);
      await vi.advanceTimersByTimeAsync(2 * 60_000 + 100);
      focusManager.setFocused(true);
      await Promise.resolve();
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(2);

    // Khi FCM SW bắn invalidateQueries -> refetch ngay lập tức dù còn mới
    await act(async () => {
      await qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(3);
  });
});
