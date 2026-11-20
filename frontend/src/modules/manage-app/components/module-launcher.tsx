"use client";

import { LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/shares/components/common/empty-state";

import { LauncherFooter } from "./launcher-footer";
import { LauncherHeader } from "./launcher-header";
import { ModuleGroupCard } from "./module-group-card";
import { useModuleLauncher } from "./hooks/use-module-launcher";

/**
 * Màn chọn module khu vực quản trị: lời chào cá nhân, lưới thẻ nhóm module thu gọn và trạng thái hệ thống.
 * Mỗi thẻ đại diện cho một nhóm (`ModuleDescriptor.group`), bấm vào sẽ mở không gian làm việc của nhóm đó.
 *
 * @returns Giao diện trung tâm điều hướng quản trị.
 */
export function ModuleLauncher() {
  const t = useTranslations("manageApp");
  const { groups, user, displayName } = useModuleLauncher();

  return (
    <section className="w-full max-w-4xl space-y-7" aria-labelledby="launcher-title">
      <LauncherHeader displayName={displayName} user={user} />

      {groups.length === 0 ? (
        <div className="bg-card rounded-2xl border">
          <EmptyState
            icon={<LayoutGrid className="size-6" />}
            title={t("empty.title")}
            description={t("empty.description")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="module-launcher">
          {groups.map((group) => (
            <ModuleGroupCard key={group.code} group={group} />
          ))}
        </div>
      )}

      <LauncherFooter user={user} />
    </section>
  );
}
