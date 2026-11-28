"use client";

import type { ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useLanguage } from "../../hooks/use-language";
import { LanguageForm } from "./language-form";

/**
 * Hồ sơ chi tiết một ngôn ngữ: thông tin chung + tab lịch sử thay đổi (`?tab=history`).
 *
 * @param props - ID ngôn ngữ, chế độ sửa và slot lịch sử.
 * @returns Giao diện chi tiết ngôn ngữ.
 */
export function LanguageProfile({
  id,
  isEditing,
  history,
}: {
  id: string;
  isEditing: boolean;
  history?: ReactNode;
}) {
  const router = useRouter();
  const query = useLanguage(id);

  if (query.isPending) {
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  }

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={SYSTEM_ROUTES.languages}
      />
    );
  }

  const language = query.data;
  const detailRoute = SYSTEM_ROUTES.languageDetail(id);

  return (
    <FormPage
      title={`${language.flagEmoji ? `${language.flagEmoji} ` : ""}${language.name}`}
      backHref={SYSTEM_ROUTES.languages}
    >
      <RecordDetailTabs
        general={
          <LanguageForm
            initial={language}
            canEdit={isEditing}
            onSuccess={() => router.replace(detailRoute)}
          />
        }
        history={history}
      />
    </FormPage>
  );
}
