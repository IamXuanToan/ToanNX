"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { QrCodeTable } from "@/modules/utilities/components/qr-code/qr-code-table";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * View danh sách mã QR trong Client Portal:
 * Chuẩn hóa giao diện theo thiết kế Admin sử dụng chung QrCodeTable với đầy đủ tính năng
 * tìm kiếm, lọc loại mã QR, xem ảnh xem trước, phân trang, chọn hàng loạt và xóa.
 *
 * @returns View danh sách mã QR.
 */
export function PortalQrCodeListView() {
  const t = useTranslations("portal.qrCodes");

  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  const canCreate = usePermission(QR_CODE_PERMISSIONS.create);
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);
  const canDelete = usePermission(QR_CODE_PERMISSIONS.delete);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={PORTAL_ROUTES.qrCodeCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <QrCodeTable
        canUpdate={canUpdate}
        canDelete={canDelete}
        showOwner={false}
        ownerOnly
        detailRoute={PORTAL_ROUTES.qrCodeDetail}
      />
    </div>
  );
}
