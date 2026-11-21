"use client";

import { useTranslations } from "next-intl";

import { FormSection } from "@/shares/components/common/form-section";
import { ICON_PATHS } from "@/shares/lib/asset-paths";

import type { User } from "../types/user.types";
import { UserSocialAccountCard } from "./user-social-account-card";

interface UserSocialAccountsSectionProps {
  user: User;
}

/**
 * Khối hiển thị thông tin các tài khoản mạng xã hội liên kết của người dùng (Google, GitHub)
 * trong trang chi tiết người dùng dành cho Quản trị viên.
 *
 * @param props - Thông tin người dùng cần hiển thị.
 * @returns Khối tài khoản mạng xã hội.
 */
export function UserSocialAccountsSection({ user }: UserSocialAccountsSectionProps) {
  const t = useTranslations("system.account.users");
  const accounts = user.socialAccounts ?? [];
  const google = accounts.find((item) => item.provider === "google");
  const github = accounts.find((item) => item.provider === "github");

  return (
    <FormSection title={t("sections.socialAccounts")}>
      <div className="space-y-3">
        <UserSocialAccountCard name="Google" iconSrc={ICON_PATHS.google} account={google} />
        <UserSocialAccountCard
          name="GitHub"
          iconSrc={ICON_PATHS.github}
          isDarkInvert
          account={github}
        />
      </div>
    </FormSection>
  );
}
