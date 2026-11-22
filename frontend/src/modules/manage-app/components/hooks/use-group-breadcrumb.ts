"use client";

import { useTranslations } from "next-intl";

import { usePathname } from "@/i18n/navigation";
import type { AdminGroup } from "@/shares/types/navigation.types";
import { useMessage } from "@/shares/hooks/use-message";

import { MANAGE_APP_ROUTES } from "../../constants/routes";
import { type BreadcrumbEntry } from "../admin-breadcrumb";

/**
 * Breadcrumb trong nhóm: chỉ các cấp cha của trang đang đứng (tên trang nằm ở đầu trang).
 * Trang danh sách: `Nhóm`; trang chi tiết: `Nhóm › Mục`.
 *
 * @param group - Nhóm đang đứng.
 * @returns Các mục breadcrumb (mục cuối vẫn là link).
 */
export function useGroupBreadcrumb(group?: AdminGroup): BreadcrumbEntry[] {
  const t = useTranslations("common.nav");
  const message = useMessage();
  const pathname = usePathname();
  if (!group) return [{ label: t("admin"), href: MANAGE_APP_ROUTES.admin }];
  const crumbs: BreadcrumbEntry[] = [{ label: group.name, href: group.href }];
  const section = group.modules
    .flatMap((module) => module.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (section && pathname !== section.href) {
    crumbs.push({ label: message(section.labelKey), href: section.href });
  }
  return crumbs;
}
