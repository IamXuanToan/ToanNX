"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shares/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Switch } from "@/shares/components/ui/switch";

import { useUserRolesCard } from "./hooks/use-user-roles-card";

/**
 * Vai trò của người dùng: xem (cần `iam.role.read` hoặc `iam.role.assign`) và gán/thu hồi.
 *
 * @param props - Id người dùng.
 * @returns Card vai trò, hoặc null khi không có quyền xem.
 */
export function UserRolesCard({ userId }: { userId: string }) {
  const t = useTranslations("iam.userRoles");
  const {
    isSuperuser,
    canReadRoles,
    canAssign,
    assignedRoles,
    roles,
    isAssigned,
    toggle,
    pendingRoleId,
  } = useUserRolesCard(userId);

  if (!canReadRoles && !canAssign) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{isSuperuser ? t("superuserHint") : t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {!canReadRoles ? (
          <div className="flex flex-wrap gap-1">
            {assignedRoles.data?.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.name}
              </Badge>
            ))}
          </div>
        ) : roles.isPending || assignedRoles.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          roles.data?.items.map((role) => (
            <label key={role.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {role.name}{" "}
                  <span className="text-muted-foreground font-mono text-xs">{role.code}</span>
                </p>
                {role.description ? (
                  <p className="text-muted-foreground truncate text-xs">{role.description}</p>
                ) : null}
              </div>
              <Switch
                checked={isAssigned(role.id)}
                disabled={!canAssign || !role.isActive || pendingRoleId === role.id}
                onCheckedChange={(checked) => toggle(role.id, checked)}
                aria-label={role.name}
              />
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}
