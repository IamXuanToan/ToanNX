"use client";

import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { env } from "@/shares/config/env";
import { refreshSession } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../../../constants/api-endpoints";
import { SYSTEM_ROUTES } from "../../../constants/routes";

export type FileAccessStatus = "checking" | "opening" | "forbidden";

/**
 * Hỏi API nội dung file (không theo redirect) để biết có quyền mở không.
 *
 * - 200 hoặc redirect (link ký R2 / URL công khai): chuyển trình duyệt tới API, trình duyệt tự theo redirect.
 * - 401: làm mới phiên một lần; vẫn 401 thì sang trang đăng nhập với `next` là trang này.
 * - Còn lại (404 cho cả không quyền lẫn không tồn tại): báo không có quyền.
 *
 * @param id - Id file.
 * @returns Trạng thái kiểm quyền.
 */
export function useFileAccess(id: string): FileAccessStatus {
  const router = useRouter();
  const [status, setStatus] = useState<FileAccessStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    const contentUrl = `${env.apiBasePath}${SYSTEM_API_ENDPOINTS.attachmentContent(id)}`;
    const probe = () =>
      fetch(contentUrl, { method: "GET", credentials: "same-origin", redirect: "manual" });

    void (async () => {
      try {
        let response = await probe();
        if (response.status === 401 && (await refreshSession())) response = await probe();
        if (cancelled) return;
        if (response.type === "opaqueredirect" || response.ok) {
          setStatus("opening");
          window.location.replace(contentUrl);
          return;
        }
        if (response.status === 401) {
          router.replace({
            pathname: SYSTEM_ROUTES.login,
            query: { next: window.location.pathname },
          });
          return;
        }
        setStatus("forbidden");
      } catch {
        if (!cancelled) setStatus("forbidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return status;
}
