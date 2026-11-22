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
import type { AdminHref } from "@/shares/types/navigation.types";

export type BreadcrumbEntry = { label: string; href?: AdminHref | "/admin" };

/**
 * Breadcrumb của trang quản trị.
 *
 * Chỉ ghi các cấp cha (tên trang nằm ở đầu trang), nên mục nào có `href` đều là link.
 *
 * @param props - Danh sách mục cha.
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
                {!item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center"
                  >
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
