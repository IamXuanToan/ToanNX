"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shares/components/common/page-header";

import { ModuleTable } from "../components/module-table/module-table";

/**
 * Trang quản lý module.
 *
 * @returns Giao diện module.
 */
export function ModuleListView() {
  const t = useTranslations("system.modules");
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ModuleTable />
    </div>
  );
}
