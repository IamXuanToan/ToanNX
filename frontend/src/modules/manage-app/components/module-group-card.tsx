"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Card } from "@/shares/components/ui/card";
import type { AdminGroup } from "@/shares/types/navigation.types";

/**
 * Thẻ đại diện cho một nhóm module quản trị (Hệ thống, Tiện ích) theo ngôn ngữ Clean.
 * Thiết kế tinh tế với tiêu đề, mô tả và danh sách phân hệ trực thuộc được hiển thị dạng chip thanh mảnh có icon.
 *
 * @param props - Thông tin nhóm module quản trị.
 * @returns Thẻ nhóm module với tỷ lệ cân đối và hiệu ứng tương tác cao cấp.
 */
export function ModuleGroupCard({ group }: { group: AdminGroup }) {
  const t = useTranslations("manageApp");

  return (
    <Card className="group border-border/80 hover:border-primary/50 relative h-full overflow-hidden rounded-2xl p-0 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={group.href}
        className="flex h-full flex-col justify-between p-5 outline-hidden sm:p-5.5"
      >
        {/* Đường viền nhấn màu nhẹ phía trên thẻ khi hover */}
        <div
          className="from-primary/0 via-primary/30 to-primary/0 absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        />

        {/* Khối đầu thẻ: Icon nhóm, tên nhóm, badge số lượng và nút điều hướng tròn */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="bg-primary-light text-primary border-primary/20 flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-transform duration-200 group-hover:scale-105">
              <group.icon className="size-5.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground group-hover:text-primary truncate text-base font-bold tracking-tight transition-colors">
                  {group.name}
                </h2>
                <Badge
                  variant="secondary"
                  className="border-border/60 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                >
                  {group.modules.length} {t("moduleUnit")}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-relaxed">
                {group.description}
              </p>
            </div>
          </div>

          <span className="bg-muted/40 border-border/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary flex size-8 shrink-0 items-center justify-center rounded-full border shadow-2xs transition-all duration-200">
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </span>
        </div>

        {/* Danh sách phân hệ trực thuộc dạng chip thanh mảnh có icon */}
        <div className="border-border/60 mt-4 border-t pt-3.5">
          <div className="flex flex-wrap gap-1.5">
            {group.modules.map((module) => (
              <Badge
                key={module.code}
                variant="outline"
                className="bg-muted/40 border-border/60 text-foreground/80 group-hover:border-border group-hover:bg-muted/70 group-hover:text-foreground inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
              >
                <module.icon className="text-primary size-3.5 shrink-0" aria-hidden />
                <span>{module.name}</span>
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </Card>
  );
}
