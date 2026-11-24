"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { ShortLinkTable } from "@/modules/utilities/components/short-link/short-link-table";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * View danh sách link rút gọn trong Client Portal:
 * Chuẩn hóa giao diện theo thiết kế Admin sử dụng chung ShortLinkTable với đầy đủ tính năng
 * tìm kiếm, lọc trạng thái, phân trang, công tắc bật/tắt nhanh, chọn hàng loạt và xóa.
 *
 * @returns Giao diện view.
 */
export function PortalShortLinkListView() {
  const t = useTranslations("portal.shortLinks");

  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canCreate = usePermission(SHORT_LINK_PERMISSIONS.create);
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);
  const canDelete = usePermission(SHORT_LINK_PERMISSIONS.delete);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={PORTAL_ROUTES.shortLinkCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <ShortLinkTable
        canUpdate={canUpdate}
        canDelete={canDelete}
        showOwner={false}
        ownerOnly
        detailRoute={PORTAL_ROUTES.shortLinkDetail}
      />
    </div>
  );
}
