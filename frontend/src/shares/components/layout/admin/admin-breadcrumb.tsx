"use client";

import { Fragment } from "react";

import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shares/components/ui/breadcrumb";
import type { AdminNavItem } from "@/shares/types/navigation.types";

export type BreadcrumbEntry = { label: string; href?: AdminNavItem["href"] };

/**
 * Breadcrumb của trang quản trị.
 *
 * @param props - Danh sách mục (mục cuối là trang hiện tại).
 * @returns Breadcrumb.
 */
export function AdminBreadcrumb({ items }: { items: BreadcrumbEntry[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <BreadcrumbSeparator className={last ? undefined : "hidden md:block"} />
              ) : null}
              <BreadcrumbItem className={last ? undefined : "hidden md:block"}>
                {last || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
