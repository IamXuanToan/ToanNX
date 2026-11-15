"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { QrCodeTable } from "../components/qr-code-table/qr-code-table";
import { QR_CODES_PERMISSIONS } from "../constants/qr-codes-permissions";
import { QR_CODES_ROUTES } from "../constants/routes";

/** Trang danh sách mã QR. */
export function QrCodeListView() {
  const t = useTranslations("qrCodes");
  const canRead = usePermission(QR_CODES_PERMISSIONS.read);
  const canUpdate = usePermission(QR_CODES_PERMISSIONS.update);
  const canDelete = usePermission(QR_CODES_PERMISSIONS.delete);
  const canManageAll = usePermission(QR_CODES_PERMISSIONS.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={QR_CODES_PERMISSIONS.create}>
            <Button asChild>
              <Link href={QR_CODES_ROUTES.codeCreate}>
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
