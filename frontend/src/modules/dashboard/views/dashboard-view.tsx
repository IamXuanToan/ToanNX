"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { hasPermission } from "@/modules/auth/services/auth.service";
import { accountNavigation } from "@/modules/account/navigation";
import { iamNavigation } from "@/modules/iam/navigation";
import { ModuleIcon } from "@/modules/system/components/module-icon/module-icon";
import { systemNavigation } from "@/modules/system/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { Badge } from "@/shares/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";

/**
 * Trang tổng quan quản trị: lời chào, người dùng hiện tại, module đang bật, lối tắt.
 * Không hiển thị số liệu giả.
 *
 * @returns Dashboard.
 */
export function DashboardView() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("common.nav");
  const { data } = useCurrentUser();
  if (!data) return null;
  const { user, roles, modules } = data;
  const shortcuts = [...accountNavigation, ...iamNavigation, ...systemNavigation].filter(
    (item) => !item.permission || hasPermission(data, item.permission),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("welcome", { name: user.firstName || user.email })}
        description={t("subtitle")}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("account.title")}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.isSuperuser ? <Badge>{t("account.superuser")}</Badge> : null}
            {user.isStaff ? <Badge variant="secondary">{t("account.staff")}</Badge> : null}
            {user.isNovel ? <Badge variant="outline">{t("account.novel")}</Badge> : null}
            {roles.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("modules.title")}</CardTitle>
            <CardDescription>{t("modules.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <div key={module.code} className="flex items-center gap-3 rounded-lg border p-3">
                <ModuleIcon
                  icon={module.icon}
                  iconUrl={module.iconUrl}
                  className="text-muted-foreground"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{module.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{module.description}</p>
                </div>
                <span className="text-muted-foreground ml-auto text-xs">v{module.version}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {shortcuts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">{t("shortcuts")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-muted/50 group flex items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <item.icon className="text-primary size-5" />
                <span className="font-medium">{tNav(item.labelKey)}</span>
                <ArrowRight className="text-muted-foreground ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
