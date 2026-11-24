"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { ShortLinkForm } from "@/modules/utilities/components/short-link/short-link-form";
import { useShortLink } from "@/modules/utilities/hooks/use-short-link";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component chỉnh sửa liên kết rút gọn trong Client Portal.
 *
 * @param props - Id liên kết và cờ quyền sửa.
 * @returns Giao diện chỉnh sửa link rút gọn.
 */
export function PortalShortLinkEdit({ id, canUpdate }: { id: string; canUpdate: boolean }) {
  const t = useTranslations("portal.shortLinks");
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user.id;

  const query = useShortLink(id);

  if (query.isPending) {
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

  // Cô lập quyền sở hữu: người dùng chỉ được sửa link do chính mình tạo
  const isOwner = link.ownerId === userId;
  if (!isOwner || !canUpdate) {
    return <ForbiddenView />;
  }

  return (
    <FormPage title={t("editTitle", { name: link.name })}>
      <ShortLinkForm
        link={link}
        onSaved={() => {
          router.push(PORTAL_ROUTES.shortLinks);
        }}
        onCancel={() => {
          router.push(PORTAL_ROUTES.shortLinks);
        }}
      />
    </FormPage>
  );
}
