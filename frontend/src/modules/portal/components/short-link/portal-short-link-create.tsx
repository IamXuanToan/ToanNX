"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { ShortLinkForm } from "@/modules/utilities/components/short-link/short-link-form";
import { FormPage } from "@/shares/components/common/form-page";

import { PORTAL_ROUTES } from "../../constants/routes";

/**
 * Component tạo liên kết rút gọn trong Client Portal.
 *
 * @returns Giao diện tạo link rút gọn.
 */
export function PortalShortLinkCreate() {
  const t = useTranslations("portal.shortLinks");
  const router = useRouter();

  return (
    <FormPage title={t("createTitle")}>
      <ShortLinkForm
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
