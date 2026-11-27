// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: { isProduction: true },
}));

vi.mock("@/shares/config/env", () => ({
  env: mockEnv,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/modules/home/hooks/use-report-client-error", () => ({
  useReportClientError: vi.fn(),
}));

import { AppErrorContent } from "@/modules/home/components/errors/app-error-content";
import { GlobalErrorContent } from "@/modules/home/components/errors/global-error-content";

describe("Bảo mật màn hình lỗi (ẩn chi tiết & stack trace ở production)", () => {
  afterEach(() => {
    cleanup();
    mockEnv.isProduction = true;
  });

  it("AppErrorContent ẩn errorMessage và stack trace ở production, chỉ hiện digest", () => {
    mockEnv.isProduction = true;
    const err = Object.assign(new Error("SENSITIVE_DB_SQL_LEAK"), {
      digest: "DIGEST-999",
      stack: "Error: SENSITIVE_DB_SQL_LEAK\n    at secret.ts:12:3",
    });

    render(<AppErrorContent error={err} retry={vi.fn()} />);

    expect(screen.getByText("DIGEST-999")).toBeTruthy();
    expect(screen.queryByText(/SENSITIVE_DB_SQL_LEAK/)).toBeNull();
    expect(screen.queryByText(/secret\.ts/)).toBeNull();
  });

  it("AppErrorContent hiển thị chi tiết kỹ thuật khi không phải production", () => {
    mockEnv.isProduction = false;
    const err = Object.assign(new Error("DEV_DEBUG_MESSAGE"), {
      digest: "DIGEST-DEV",
      stack: "Error: DEV_DEBUG_MESSAGE\n    at dev.ts:5:1",
    });

    render(<AppErrorContent error={err} retry={vi.fn()} />);

    expect(screen.getAllByText(/DEV_DEBUG_MESSAGE/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/dev\.ts:5:1/)).toBeTruthy();
  });

  it("GlobalErrorContent ẩn errorMessage và stack trace ở production", () => {
    mockEnv.isProduction = true;
    const err = Object.assign(new Error("GLOBAL_SECRET_EXCEPTION"), {
      digest: "GLOBAL-DIGEST-1",
      stack: "Error: GLOBAL_SECRET_EXCEPTION\n    at root.tsx:10:1",
    });

    render(<GlobalErrorContent error={err} retry={vi.fn()} />);

    expect(screen.getByText("GLOBAL-DIGEST-1")).toBeTruthy();
    expect(screen.queryByText(/GLOBAL_SECRET_EXCEPTION/)).toBeNull();
    expect(screen.queryByText(/root\.tsx/)).toBeNull();
  });
});
