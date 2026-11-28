"use client";

import type { ComponentProps, ReactNode } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { withEditMode } from "@/shares/lib/edit-mode";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { usePageFeedback } from "../../hooks/use-page-feedback";
import { PageFeedbackDetailForm } from "./page-feedback-detail-form";

/**
 * Hồ sơ chi tiết một góp ý ẩn danh: tải dữ liệu, nút Sửa (`?mode=edit`),
 * tab xử lý + cảm ơn và tab lịch sử thay đổi (`?tab=history`).
 *
 * @param props - ID góp ý, quyền sửa/cảm ơn, slot lịch sử và ngữ cảnh điều hướng.
 * @returns Giao diện chi tiết góp ý.
 */
export function PageFeedbackProfile({
  id,
  canUpdate,
  isEditing,
  canThank,
  history,
  routeContext = "admin",
}: {
  id: string;
  canUpdate: boolean;
  isEditing: boolean;
  canThank: boolean;
  history?: ReactNode;
  routeContext?: "admin" | "portal";
}) {
  const t = useTranslations("utilities.feedbacks");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const query = usePageFeedback(id);

  const resolvedBackHref = (
    routeContext === "portal" ? "/portal/feedbacks" : UTILITIES_ROUTES.pageFeedbacks
  ) as ComponentProps<typeof Link>["href"];

  if (query.isPending) {
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  }

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={resolvedBackHref}
      />
    );
  }

  const feedback = query.data;
  const targetRoute =
    routeContext === "portal"
      ? { pathname: "/portal/feedbacks/[id]" as const, params: { id } }
      : UTILITIES_ROUTES.pageFeedbackDetail(id);

  return (
    <FormPage
      title={feedback.targetTitle || t("detailTitle")}
      backHref={resolvedBackHref}
      actions={
        <div className="flex items-center gap-2">
          <FormBackButton href={resolvedBackHref} />
          {canUpdate && !isEditing ? (
            <Button asChild size="sm">
              <Link href={withEditMode(targetRoute) as ComponentProps<typeof Link>["href"]}>
                <Pencil className="mr-2 size-4" />
                {tCommon("actions.edit")}
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <RecordDetailTabs
        general={
          <PageFeedbackDetailForm
            feedback={feedback}
            canEdit={isEditing}
            canThank={canThank}
            onSuccess={() => {
              router.replace(targetRoute as Parameters<typeof router.replace>[0]);
            }}
          />
        }
        history={history}
      />
    </FormPage>
  );
}
