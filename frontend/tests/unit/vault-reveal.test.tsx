// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { VaultItemDetail } from "@/modules/workspace/components/vault-item/vault-item-detail";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

const mockReveal = vi.fn().mockResolvedValue({
  id: "v-1",
  title: "Production DB",
  username: "postgres",
  secret: "super-secret-value-999",
  url: "",
  revealedAt: "2026-11-26T10:00:00Z",
  revealedByEmail: "member@test.local",
  revealedByName: "Member Test",
  revealedByUsername: "member",
});

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/vault/v-1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/modules/workspace/services/vault-item.service", () => ({
  vaultItemService: {
    get: vi.fn().mockResolvedValue({
      id: "v-1",
      ownerId: "u1",
      ownerEmail: "u1@test.local",
      ownerName: "U1",
      ownerUsername: "u1",
      title: "Production DB",
      category: "SERVER",
      username: "postgres",
      secretLast4: "9999",
      url: "",
      notes: "",
      tags: ["prod"],
      lastRevealedAt: null,
      lastRevealedById: null,
      lastRevealedByEmail: "",
      lastRevealedByName: "",
      lastRevealedByUsername: "",
      createdAt: "2026-11-26T00:00:00Z",
      updatedAt: "2026-11-26T00:00:00Z",
    }),
    reveal: (...args: unknown[]) => mockReveal(...args),
  },
}));

describe("VaultItemDetail (reveal permission & VaultRevealDialog)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("ẩn nút Giải mã nếu không có quyền vault_item.reveal", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <VaultItemDetail id="v-1" canUpdate={false} canReveal={false} />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Production DB")).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: "reveal" })).toBeNull();
  });

  it("hiện nút Giải mã khi có quyền reveal và hiển thị secret trong VaultRevealDialog", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <VaultItemDetail id="v-1" canUpdate canReveal />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "reveal" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "reveal" }));
    await waitFor(() => {
      expect(mockReveal).toHaveBeenCalledWith("v-1");
      expect(screen.getByText("super-secret-value-999")).toBeTruthy();
    });
  });
});
