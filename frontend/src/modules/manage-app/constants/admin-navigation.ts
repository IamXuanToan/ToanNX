import { accountNavigation } from "@/modules/account/navigation";
import { attachmentNavigation } from "@/modules/attachment/navigation";
import { authenticationAccountItems } from "@/modules/auth/navigation";
import { iamNavigation } from "@/modules/iam/navigation";
import { customPagesNavigation } from "@/modules/custom-pages/navigation";
import { qrCodesNavigation } from "@/modules/qr-codes/navigation";
import { shortLinksNavigation } from "@/modules/short-links/navigation";
import { journalNavigation } from "@/modules/journal/navigation";
import { novelNavigation } from "@/modules/novel/navigation";
import { BookOpen, LayoutTemplate, type LucideIcon, Settings } from "lucide-react";

import type { AdminGroupCode, AdminModuleNavigation } from "@/shares/types/navigation.types";

/**
 * Nhóm module hiển thị ở màn chọn (một thẻ mỗi nhóm), theo thứ tự hiển thị.
 * Module tự khai nhóm của mình trong `navigation.ts` (`group`). Tên/mô tả: `common.adminGroups.<code>`.
 * Danh sách hoàn toàn khai tĩnh ở FE: không có API hay bảng cấu hình module.
 */
export const ADMIN_GROUPS: { code: AdminGroupCode; icon: LucideIcon }[] = [
  { code: "system", icon: Settings },
  { code: "content", icon: LayoutTemplate },
  { code: "novel", icon: BookOpen },
];

/**
 * Điều hướng quản trị theo module, theo thứ tự hiển thị trong sidebar của nhóm.
 * Module FE mới: thêm `navigation.ts` của nó vào đây (nhãn/tên khai trong namespace của module).
 * `tests/unit/module-registry.test.ts` báo lỗi nếu module có `navigation.ts` mà quên đăng ký.
 */
export const ADMIN_MODULE_NAVIGATION: AdminModuleNavigation[] = [
  { ...accountNavigation, items: [...accountNavigation.items, ...authenticationAccountItems] },
  iamNavigation,
  attachmentNavigation,
  journalNavigation,
  shortLinksNavigation,
  qrCodesNavigation,
  customPagesNavigation,
  novelNavigation,
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
