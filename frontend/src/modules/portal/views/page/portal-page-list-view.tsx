"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageCreateButton } from "@/modules/utilities/components/page/page-create-button";
import { PageTable } from "@/modules/utilities/components/page/page-table";
import { PAGE_PATH_PERMISSIONS } from "@/modules/utilities/permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * View danh sách trang của thành viên trong Client Portal:
 * Chuẩn hóa giao diện theo thiết kế Admin sử dụng chung PageTable với đầy đủ tính năng
 * tìm kiếm, lọc loại/trạng thái, phân trang, chọn hàng loạt và xóa.
 *
 * @returns Giao diện view.
 */
export function PortalPageListView() {
  const t = useTranslations("portal.pages");

  const canRead = usePermission(PAGE_PERMISSIONS.read);
  const canCreate = usePermission(PAGE_PERMISSIONS.create);
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canDelete = usePermission(PAGE_PERMISSIONS.delete);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);

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
            <PageCreateButton
              canCreatePath={canCreatePath}
              canUpdatePath={canUpdatePath}
              portalMode
            />
          ) : null
        }
      />
      <PageTable
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        showOwner={false}
        ownerOnly
        detailRoute={(id: string) => PORTAL_ROUTES.pageDetail(id)}
      />
    </div>
  );
}
