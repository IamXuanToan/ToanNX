// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Laptop } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isPortalNavItemActive,
  PORTAL_NAV_SECTIONS,
  PORTAL_SIDEBAR_COLLAPSED_KEY,
} from "@/modules/portal/constants/navigation";
import { PortalSidebarSection } from "@/modules/portal/components/layout/portal-sidebar-section";
import { WORKSPACE_ROUTES } from "@/modules/workspace/constants/routes";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

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

vi.mock("@/shares/components/ui/sidebar", () => ({
  SidebarMenu: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ul className={className}>{children}</ul>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarMenuButton: ({
    children,
    isActive,
  }: {
    children: React.ReactNode;
    isActive?: boolean;
    asChild?: boolean;
    tooltip?: string;
    className?: string;
  }) => <div data-active={isActive ? "true" : undefined}>{children}</div>,
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Portal Navigation Refactor", () => {
  it("gọn sidebar: bỏ các mục con thừa và gộp Thư viện vào Tiện ích", () => {
    expect(PORTAL_NAV_SECTIONS.map((s) => s.key)).toEqual([
      "overview",
      "workspace",
      "utilities",
      "finance",
    ]);

    const workspaceKeys = PORTAL_NAV_SECTIONS.find((s) => s.key === "workspace")?.items.map(
      (i) => i.key,
    );
    expect(workspaceKeys).toEqual(["reminders", "subscriptions", "assets", "vault"]);

    const utilitiesKeys = PORTAL_NAV_SECTIONS.find((s) => s.key === "utilities")?.items.map(
      (i) => i.key,
    );
    expect(utilitiesKeys).toContain("files");
    expect(PORTAL_SIDEBAR_COLLAPSED_KEY).not.toContain("toannx");
  });

  it("sáng mục cha tương ứng khi truy cập các route con ẩn trên sidebar", () => {
    const workspace = PORTAL_NAV_SECTIONS.find((s) => s.key === "workspace")!.items;
    const assetsItem = workspace.find((i) => i.key === "assets")!;
    const subsItem = workspace.find((i) => i.key === "subscriptions")!;
    const dashboardItem = PORTAL_NAV_SECTIONS[0].items[0];

    expect(isPortalNavItemActive("/portal/warranty-claims", assetsItem)).toBe(true);
    expect(isPortalNavItemActive("/portal/warranty-claims/claim-123", assetsItem)).toBe(true);
    expect(isPortalNavItemActive("/portal/subscription-payments", subsItem)).toBe(true);

    expect(isPortalNavItemActive("/portal", dashboardItem)).toBe(true);
    expect(isPortalNavItemActive("/portal/assets", dashboardItem)).toBe(false);
  });

  it("thu gọn/mở rộng nhóm cụm menu, lưu localStorage và luôn mở nhóm đang active", () => {
    render(
      <TooltipProvider>
        <PortalSidebarSection
          sectionKey="workspace"
          label="Cá nhân"
          index={1}
          items={[
            {
              key: "assets",
              title: "Thiết bị & Tài sản",
              href: WORKSPACE_ROUTES.assets,
              icon: Laptop,
              active: false,
            },
          ]}
          onNavigate={vi.fn()}
        />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Cá nhân" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(window.localStorage.getItem(PORTAL_SIDEBAR_COLLAPSED_KEY)).toBe('["workspace"]');

    cleanup();
    // Khi có mục đang active trong nhóm đã từng thu gọn -> vẫn tự động mở để không mất ngữ cảnh
    render(
      <TooltipProvider>
        <PortalSidebarSection
          sectionKey="workspace"
          label="Cá nhân"
          index={1}
          items={[
            {
              key: "assets",
              title: "Thiết bị & Tài sản",
              href: WORKSPACE_ROUTES.assets,
              icon: Laptop,
              active: true,
            },
          ]}
          onNavigate={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Cá nhân" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });
});
