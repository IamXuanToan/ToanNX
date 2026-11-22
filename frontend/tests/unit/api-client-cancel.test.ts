// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shares/lib/api/api-client";
import { ApiError, CLIENT_ERROR_CODES } from "@/shares/lib/api/api-error";

/**
 * Hủy từ bên ngoài (React Query) không được abort `fetch`: abort làm lý do hủy lọt vào promise không ai bắt và
 * Next dev báo "Runtime Error: cancelled". `apiClient` chỉ trả lỗi `REQUEST_CANCELLED` của chính nó.
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient: hủy request", () => {
  it("hủy giữa chừng: reject REQUEST_CANCELLED và không abort fetch", async () => {
    let fetchSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      fetchSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => undefined);
    });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const pending = apiClient.get("/system/currencies", { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.cancelled });
    await expect(pending).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchSignal?.aborted).toBe(false);
  });

  it("tín hiệu đã hủy từ trước: reject ngay, không gọi fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiClient.get("/system/currencies", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.cancelled });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("không hủy: trả dữ liệu bình thường", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: [{ id: "1" }], meta: {} }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const result = await apiClient.get<{ id: string }[]>("/system/currencies", {
      signal: new AbortController().signal,
    });
    expect(result.data).toEqual([{ id: "1" }]);
  });
});
