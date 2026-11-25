"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { useFinanceRoutes } from "../../hooks/use-finance-routes";

/** Nút tạo khoản thu mới tự động điều hướng theo context Portal hoặc Admin. */
export function IncomeCreateButton() {
  const t = useTranslations("finance.incomes");
  const routes = useFinanceRoutes();

  return (
    <Button asChild>
      <Link href={routes.incomeCreate}>
        <Plus />
        {t("create")}
      </Link>
    </Button>
  );
}
