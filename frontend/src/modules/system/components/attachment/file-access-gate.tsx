"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LoadingState } from "@/shares/components/common/loading-state";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useFileAccess } from "./hooks/use-file-access";

/**
 * Kiểm quyền mở file: có quyền thì chuyển tới file, chưa đăng nhập thì sang trang đăng nhập (quay lại sau),
 * không quyền hoặc không tồn tại thì cùng một thông báo (không lộ file nào tồn tại).
 *
 * @param props - Id file.
 * @returns Khung chờ hoặc màn không có quyền.
 */
export function FileAccessGate({ id }: { id: string }) {
  const t = useTranslations("system.fileAccess");
  const status = useFileAccess(id);

  if (status !== "forbidden") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <LoadingState rows={3} />
      </div>
    );
  }
  return (
    <ForbiddenView
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/">{t("backHome")}</Link>
          </Button>
          <Button asChild className="h-10 rounded-xl">
            <Link
              href={{
                pathname: SYSTEM_ROUTES.login,
                query: { next: typeof window === "undefined" ? "" : window.location.pathname },
              }}
            >
              {t("signInOther")}
            </Link>
          </Button>
        </div>
      }
    />
  );
}
