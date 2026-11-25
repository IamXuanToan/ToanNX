// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let mockSearchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

import { useTabState } from "@/shares/hooks/use-tab-state";

describe("useTabState", () => {
  const validTabs = ["products", "design", "settings"] as const;

  it("Khởi tạo tab mặc định khi URL không có query param", () => {
    mockSearchParams = new URLSearchParams("");
    const { result } = renderHook(() =>
      useTabState({
        validTabs,
        defaultTab: "products",
      }),
    );

    expect(result.current[0]).toBe("products");
  });

  it("Khởi tạo đúng tab từ query param trên URL", () => {
    mockSearchParams = new URLSearchParams("tab=settings");
    const { result } = renderHook(() =>
      useTabState({
        validTabs,
        defaultTab: "products",
      }),
    );

    expect(result.current[0]).toBe("settings");
  });

  it("Fallback về defaultTab khi query param không hợp lệ", () => {
    mockSearchParams = new URLSearchParams("tab=unknown_tab");
    const { result } = renderHook(() =>
      useTabState({
        validTabs,
        defaultTab: "design",
      }),
    );

    expect(result.current[0]).toBe("design");
  });

  it("Chuyển tab và cập nhật window.history mà không reload", () => {
    mockSearchParams = new URLSearchParams("");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() =>
      useTabState({
        validTabs,
        defaultTab: "products",
      }),
    );

    act(() => {
      result.current[1]("settings");
    });

    expect(result.current[0]).toBe("settings");
    expect(replaceStateSpy).toHaveBeenCalled();
  });
});
