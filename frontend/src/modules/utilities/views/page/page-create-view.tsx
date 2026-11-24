"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PageCreateFlow } from "../../components/page/page-create-flow";
import { PAGE_PATH_PERMISSIONS } from "../../permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "../../permissions/page-permission";

/** Trang tạo trang: mở dialog chọn loại trang và cài đặt ban đầu trước khi vào màn hình soạn thảo. */
export function PageCreateView() {
  const canCreate = usePermission(PAGE_PERMISSIONS.create);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);

  if (!canCreate) return <ForbiddenView />;

  return <PageCreateFlow canCreatePath={canCreatePath} canUpdatePath={canUpdatePath} />;
}
