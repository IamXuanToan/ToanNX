"use client";

import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Switch } from "@/shares/components/ui/switch";

import type { RoleDetail } from "../../types/iam.types";
import { useRolePermissionsCard } from "./hooks/use-role-permissions-card";

/**
 * Gán/thu hồi quyền cho vai trò, nhóm theo module.
 *
 * @param props - Vai trò, quyền xem danh sách quyền, quyền gán.
 * @returns Card quyền.
 */
export function RolePermissionsCard({
  role,
  canRead,
  canAssign,
}: {
  role: RoleDetail;
  canRead: boolean;
  canAssign: boolean;
}) {
  const t = useTranslations("iam.roles");
  const { isLoading, groups, isAssigned, toggle, pendingId } = useRolePermissionsCard(
    role,
    canRead,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("permissions")}</CardTitle>
        <CardDescription>{role.isSystem ? t("systemHint") : t("permissionsHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? <Skeleton className="h-40 w-full" /> : null}
        {groups.map(([module, permissions]) => (
          <section key={module} className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {module}
            </h3>
            {permissions.map((permission) => (
              <label key={permission.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{permission.name}</p>
                  {permission.description ? (
                    <p className="text-muted-foreground text-xs">{permission.description}</p>
                  ) : null}
                  <p className="text-muted-foreground font-mono text-xs">{permission.code}</p>
                </div>
                <Switch
                  checked={isAssigned(permission.id)}
                  disabled={!canAssign || pendingId === permission.id}
                  onCheckedChange={(checked) => toggle(permission.id, checked)}
                  aria-label={permission.code}
                />
              </label>
            ))}
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
