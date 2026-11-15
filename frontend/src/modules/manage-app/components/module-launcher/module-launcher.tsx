"use client";

import { ArrowRight, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shares/components/common/empty-state/empty-state";

import { useModuleLauncher } from "./hooks/use-module-launcher";

/**
 * Lời chào và lưới nhóm module người dùng vào được, căn giữa màn hình.
 * Mỗi thẻ là một nhóm (`ModuleDescriptor.group`); bấm → trang đầu tiên của nhóm, sidebar chia theo module.
 *
 * @returns Lưới chọn module.
 */
export function ModuleLauncher() {
  const t = useTranslations("manageApp");
  const { groups, name } = useModuleLauncher();

  return (
    <section className="w-full max-w-4xl space-y-8" aria-labelledby="launcher-title">
      <div className="space-y-1.5 text-center">
        <h1 id="launcher-title" className="text-xl font-semibold text-balance">
          {t("welcome", { name })}
        </h1>
      </div>

      {groups.length === 0 ? (
        <div className="bg-card rounded-xl border">
          <EmptyState
            icon={<LayoutGrid className="size-6" />}
            title={t("empty.title")}
            description={t("empty.description")}
          />
        </div>
      ) : (
        <ul className="flex flex-wrap justify-center gap-3" data-testid="module-launcher">
          {groups.map((group) => (
            <li
              key={group.code}
              className="w-full sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]"
            >
              <Link
                href={group.href}
                className="group bg-card hover:border-primary/40 focus-visible:border-primary flex h-full flex-col gap-4 rounded-xl border p-5 outline-hidden transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="bg-primary-light text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <group.icon className="size-5" aria-hidden />
                  </span>
                  <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold">{group.name}</p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{group.description}</p>
                </div>
                <ul className="mt-auto flex flex-wrap gap-1.5 border-t pt-4">
                  {group.modules.map((module) => (
                    <li
                      key={module.code}
                      className="bg-muted text-foreground/75 inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs"
                    >
                      <module.icon className="size-3.5" aria-hidden />
                      {module.name}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
