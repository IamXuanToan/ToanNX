// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/truyen",
}));

vi.mock("next/script", () => ({
  default: (props: Record<string, unknown>) => <script data-testid="umami-script" {...props} />,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

vi.mock("@/shares/config/env", () => ({
  env: {
    isProduction: false,
    umamiWebsiteId: "11111111-1111-1111-1111-111111111111",
  },
}));

import { AppAnalytics } from "@/shares/components/analytics/app-analytics";

describe("AppAnalytics (Umami v2 beforeSend)", () => {
  it("gắn data-website-id + data-before-send và giữ nguyên payload (type, payload) cho trang công khai", () => {
    const { container } = render(<AppAnalytics />);
    const scriptTag = container.querySelector('[data-testid="umami-script"]');
    expect(scriptTag?.getAttribute("data-website-id")).toBe("11111111-1111-1111-1111-111111111111");
    expect(scriptTag?.getAttribute("data-before-send")).toBe("umamiBeforeSend");

    const inlineScript = container.querySelector("script:not([data-testid])")?.innerHTML ?? "";
    // Thực thi hàm inline để kiểm tra chữ ký 2 tham số (type, payload) của Umami v2
    new Function(inlineScript)();
    const handler = (window as unknown as { umamiBeforeSend: (t: string, p: unknown) => unknown })
      .umamiBeforeSend;

    const publicPayload = { website: "11111111-1111-1111-1111-111111111111", url: "/vi/truyen" };
    expect(handler("event", publicPayload)).toEqual(publicPayload);
    expect(handler("event", { website: "1111", url: "/vi/quan-tri/nguoi-dung" })).toBe(false);
    expect(handler("event", { website: "1111", url: "/vi/ca-nhan/nhac-viec" })).toBe(false);
  });
});
