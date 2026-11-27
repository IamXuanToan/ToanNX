"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { ShortLinkForm } from "@/modules/utilities/components/short-link/short-link-form";
import { useShortLink } from "@/modules/utilities/hooks/use-short-link";
import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component chi tiết và chỉnh sửa liên kết rút gọn trong Client Portal.
 *
 * @param props - Id liên kết, cờ đang sửa và quyền quản lý mọi bản ghi.
 * @returns Giao diện chi tiết / chỉnh sửa link rút gọn.
 */
export function PortalShortLinkEdit({
  id,
  canUpdate,
  canManageAll = false,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canManageAll?: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("portal.shortLinks");
  const router = useRouter();
  const { data: currentUser, isPending: isUserPending } = useCurrentUser();
  const userId = currentUser?.user.id;

  const query = useShortLink(id);

  if (query.isPending || isUserPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={PORTAL_ROUTES.shortLinks}
      />
    );
  }

  const link = query.data;

  // Cô lập quyền sở hữu: người dùng chỉ được xem/sửa link do chính mình tạo (trừ manage_all)
  const isOwner = link.ownerId === userId;
  if (!isOwner && !canManageAll) {
    return <ForbiddenView />;
  }

  return (
    <FormPage title={t("editTitle", { name: link.name })} backHref={PORTAL_ROUTES.shortLinks}>
      <RecordDetailTabs
        general={
          <ShortLinkForm
            link={link}
            disabled={!canUpdate}
            backHref={PORTAL_ROUTES.shortLinks}
            onSaved={() => {
              router.push(PORTAL_ROUTES.shortLinks);
            }}
          />
        }
        history={history}
      />
    </FormPage>
  );
}
