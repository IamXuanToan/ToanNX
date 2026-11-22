"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/system/components/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { QrCodeTable } from "../components/qr-code-table";
import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";
import { UTILITIES_ROUTES } from "../constants/routes";

/** Trang danh sách mã QR. */
export function QrCodeListView() {
  const t = useTranslations("utilities.qrCodes");
  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);
  const canDelete = usePermission(QR_CODE_PERMISSIONS.delete);
  const canManageAll = usePermission(QR_CODE_PERMISSIONS.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={QR_CODE_PERMISSIONS.create}>
            <Button asChild>
              <Link href={UTILITIES_ROUTES.qrCodeCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <QrCodeTable canUpdate={canUpdate} canDelete={canDelete} showOwner={canManageAll} />
    </div>
  );
}
