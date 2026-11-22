// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Folder } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModuleGroupCard } from "@/modules/manage-app/components/launcher/module-group-card";
import type { AdminGroup } from "@/shares/types/navigation.types";

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

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { count?: number }) => {
    const map: Record<string, string> = {
      itemUnit: "mục",
      moreItemsTrigger: `+${params?.count ?? 0} mục khác`,
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/shares/hooks/use-message", () => ({
  useMessage: () => (key: string) => {
    const map: Record<string, string> = {
      "system.account.nav.users": "Người dùng",
      "system.account.nav.roles": "Vai trò",
      "system.account.nav.permissions": "Quyền",
      "system.account.nav.sessions": "Phiên",
      "system.account.nav.attachments": "Thư viện",
    };
    return map[key] ?? key;
  },
}));

describe("ModuleGroupCard", () => {
  afterEach(() => {
    cleanup();
  });

  const createMockGroup = (itemCount: number): AdminGroup => {
    const allItems = [
      {
        labelKey: "system.account.nav.users" as const,
        href: "/admin/users" as const,
        icon: Folder,
      },
      {
        labelKey: "system.account.nav.roles" as const,
        href: "/admin/roles" as const,
        icon: Folder,
      },
      {
        labelKey: "system.account.nav.permissions" as const,
        href: "/admin/permissions" as const,
        icon: Folder,
      },
      {
        labelKey: "system.account.nav.sessions" as const,
        href: "/admin/sessions" as const,
        icon: Folder,
      },
      {
        labelKey: "system.account.nav.attachments" as const,
        href: "/admin/attachments" as const,
        icon: Folder,
      },
    ];

    const selectedItems = allItems.slice(0, itemCount);

    return {
      code: "system",
      name: "Hệ thống",
      description: "Quản trị hệ thống và người dùng",
      icon: Folder,
      href: "/admin/users",
      modules: [
        {
          code: "system",
          name: "Hệ thống",
          description: "Mô tả",
          icon: Folder,
          href: "/admin/users",
          items: selectedItems,
        },
      ],
    };
  };

  it("chỉ hiển thị tối đa 2 mục trực tiếp và hiển thị badge +X khi nhóm có nhiều hơn 2 mục", () => {
    const group = createMockGroup(5);
    render(<ModuleGroupCard group={group} />);

    // 2 mục đầu tiên phải hiển thị trực tiếp
    expect(screen.getByText("Người dùng")).toBeDefined();
    expect(screen.getByText("Vai trò")).toBeDefined();

    // Các mục thứ 3, 4, 5 không hiển thị trực tiếp ở ngoài thẻ
    // Badge +3 phải xuất hiện
    expect(screen.getByText("+3")).toBeDefined();
  });

  it("không hiển thị badge +X khi nhóm chỉ có 2 mục hoặc ít hơn", () => {
    const group = createMockGroup(2);
    render(<ModuleGroupCard group={group} />);

    expect(screen.getByText("Người dùng")).toBeDefined();
    expect(screen.getByText("Vai trò")).toBeDefined();
    expect(screen.queryByText(/^\+\d+/)).toBeNull();
  });
});
