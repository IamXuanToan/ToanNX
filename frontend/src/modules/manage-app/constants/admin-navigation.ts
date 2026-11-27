import { financeNavigation } from "@/modules/finance/navigation";
import { novelNavigation } from "@/modules/novel/navigation";
import { systemNavigation } from "@/modules/system/navigation";
import { utilitiesNavigation } from "@/modules/utilities/navigation";
import { WORKSPACE_ROUTES } from "@/modules/workspace/constants/routes";
import { ASSISTANT_CONFIG_PERMISSIONS } from "@/modules/workspace/permissions/assistant-config-permission";
import { BookOpen, Bot, LayoutTemplate, type LucideIcon, Settings, Wallet } from "lucide-react";

import type {
  AdminGroupCode,
  AdminModuleNavigation,
  AdminNavItem,
  AdminNavSection,
} from "@/shares/types/navigation.types";

/**
 * Nhóm module hiển thị ở màn chọn (một thẻ mỗi nhóm), theo thứ tự hiển thị.
 * Module tự khai nhóm của mình trong `navigation.ts` (`group`). Tên/mô tả: `common.adminGroups.<code>`.
 * Danh sách hoàn toàn khai tĩnh ở FE: không có API hay bảng cấu hình module.
 */
export const ADMIN_GROUPS: { code: AdminGroupCode; icon: LucideIcon }[] = [
  { code: "system", icon: Settings },
  { code: "content", icon: LayoutTemplate },
  { code: "novel", icon: BookOpen },
  { code: "finance", icon: Wallet },
];

/**
 * Điều hướng quản trị theo module, theo thứ tự hiển thị trong sidebar của nhóm.
 * Module FE mới: thêm `navigation.ts` của nó vào đây (nhãn/tên khai trong namespace của module).
 * `tests/unit/module-registry.test.ts` báo lỗi nếu module có `navigation.ts` mà quên đăng ký.
 */
const systemWithAssistantNavigation: AdminModuleNavigation = {
  ...systemNavigation,
  items: [
    ...systemNavigation.items,
    {
      labelKey: "workspace.nav.assistantConfig",
      href: WORKSPACE_ROUTES.adminAssistant,
      icon: Bot,
      permission: ASSISTANT_CONFIG_PERMISSIONS.read,
      section: "system.navSections.operations",
    },
  ],
};

export const ADMIN_MODULE_NAVIGATION: AdminModuleNavigation[] = [
  systemWithAssistantNavigation,
  utilitiesNavigation,
  novelNavigation,
  financeNavigation,
];

/**
 * Module chứa đường dẫn hiện tại (so theo tiền tố của các mục menu).
 *
 * @param pathname - Pathname nội bộ (không có tiền tố ngôn ngữ).
 * @returns Mã module, hoặc undefined nếu không thuộc module nào.
 */
export function findModuleCodeByPath(pathname: string): string | undefined {
  return ADMIN_MODULE_NAVIGATION.find((navigation) =>
    navigation.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
  )?.module;
}

/**
 * Mục menu đang mở: href khớp **dài nhất** (`/admin/finance` không sáng khi đang ở `/admin/finance/transactions`).
 *
 * @param pathname - Pathname nội bộ.
 * @param hrefs - Href các mục đang hiển thị.
 * @returns Href của mục đang mở, hoặc undefined.
 */
export function findActiveNavHref(pathname: string, hrefs: readonly string[]): string | undefined {
  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * Gom các mục menu liền nhau cùng `section` thành cụm (giữ thứ tự khai báo). Chạy sau khi lọc quyền nên cụm
 * hết mục tự biến mất, không còn nhãn hay vạch ngăn thừa.
 *
 * @param items - Mục menu đã lọc quyền của một module.
 * @returns Danh sách cụm theo thứ tự hiển thị.
 */
export function groupNavSections(items: readonly AdminNavItem[]): AdminNavSection[] {
  const sections: AdminNavSection[] = [];
  for (const item of items) {
    const last = sections.at(-1);
    if (last && last.labelKey === item.section) last.items.push(item);
    else sections.push({ labelKey: item.section, items: [item] });
  }
  return sections;
}
