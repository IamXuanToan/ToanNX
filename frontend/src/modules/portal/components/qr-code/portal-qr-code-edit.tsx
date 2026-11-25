"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { qrCodeService } from "@/modules/utilities/services/qr-code.service";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { PORTAL_ROUTES } from "../../constants/routes";
import { PortalQrCodeForm } from "./portal-qr-code-form";

/**
 * Component chi tiết và chỉnh sửa mã QR trong Client Portal.
 *
 * @param props - ID mã QR, cờ đang sửa và quyền quản lý mọi bản ghi.
 * @returns Giao diện chi tiết / chỉnh sửa mã QR.
 */
export function PortalQrCodeEdit({
  id,
  canUpdate,
  canManageAll = false,
}: {
  id: string;
  canUpdate: boolean;
  canManageAll?: boolean;
}) {
  const t = useTranslations("portal.qrCodes");
  const { data: currentUser, isPending: isUserPending } = useCurrentUser();

  const {
    data: code,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal-qr-code-detail", id],
    queryFn: ({ signal }) => qrCodeService.get(id, signal),
  });

  if (isLoading || isUserPending) {
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  }

  if (isError || !code) {
    return (
      <QueryErrorState error={error} onRetry={() => refetch()} backHref={PORTAL_ROUTES.qrCodes} />
    );
  }

  if (code.ownerId !== currentUser?.user.id && !canManageAll) {
    return <ForbiddenView />;
  }

  return (
    <FormPage title={t("editTitle", { name: code.name })}>
      <PortalQrCodeForm code={code} disabled={!canUpdate} />
    </FormPage>
  );
}
