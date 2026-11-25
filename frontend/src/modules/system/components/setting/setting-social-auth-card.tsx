"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ICON_PATHS } from "@/shares/lib/asset-paths";
import { Badge } from "@/shares/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shares/components/ui/card";
import { Switch } from "@/shares/components/ui/switch";

import { useSettings } from "../../hooks/use-settings";
import { useUpdateSetting } from "../../hooks/use-update-setting";

interface SettingSocialAuthCardProps {
  canUpdate: boolean;
}

/**
 * Thẻ cấu hình phương thức đăng nhập mạng xã hội (Google & GitHub).
 * Cho phép quản trị viên gạt công tắc bật/tắt nhanh các provider OAuth.
 *
 * @param props - Quyền cập nhật cài đặt.
 * @returns Thẻ quản lý OAuth settings.
 */
export function SettingSocialAuthCard({ canUpdate }: SettingSocialAuthCardProps) {
  const t = useTranslations("system.settings.socialAuth");
  const { data: settingsData, isPending } = useSettings({ category: "auth", page_size: 20 });

  const googleSetting = settingsData?.items.find((s) => s.key === "auth_google_enabled");
  const githubSetting = settingsData?.items.find((s) => s.key === "auth_github_enabled");

  const updateGoogle = useUpdateSetting(googleSetting?.id ?? "");
  const updateGithub = useUpdateSetting(githubSetting?.id ?? "");

  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (
    settingKey: "auth_google_enabled" | "auth_github_enabled",
    checked: boolean,
  ) => {
    const setting = settingKey === "auth_google_enabled" ? googleSetting : githubSetting;
    const updater = settingKey === "auth_google_enabled" ? updateGoogle : updateGithub;
    if (!setting) return;

    setToggling(settingKey);
    try {
      await updater.mutateAsync({ value: checked });
      toast.success(t("updatedSuccess"));
    } finally {
      setToggling(null);
    }
  };

  const isGoogleChecked = Boolean(googleSetting?.value ?? true);
  const isGithubChecked = Boolean(githubSetting?.value ?? true);

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="text-primary size-5" />
          <CardTitle className="text-base font-bold">{t("title")}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {/* Google OAuth Provider */}
        <div className="border-border/60 bg-muted/20 flex items-center justify-between gap-4 rounded-xl border p-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs">
              <Image src={ICON_PATHS.google} alt="Google" width={20} height={20} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-semibold">{t("googleTitle")}</span>
                <Badge
                  variant="outline"
                  className={
                    isGoogleChecked
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }
                >
                  {isGoogleChecked ? t("enabledBadge") : t("disabledBadge")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t("googleDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {toggling === "auth_google_enabled" ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
            <Switch
              checked={isGoogleChecked}
              onCheckedChange={(checked) => void handleToggle("auth_google_enabled", checked)}
              disabled={!canUpdate || isPending || Boolean(toggling)}
              data-testid="toggle-google-auth-switch"
            />
          </div>
        </div>

        {/* GitHub OAuth Provider */}
        <div className="border-border/60 bg-muted/20 flex items-center justify-between gap-4 rounded-xl border p-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs">
              <Image
                src={ICON_PATHS.github}
                alt="GitHub"
                width={20}
                height={20}
                className="dark:invert"
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-semibold">{t("githubTitle")}</span>
                <Badge
                  variant="outline"
                  className={
                    isGithubChecked
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }
                >
                  {isGithubChecked ? t("enabledBadge") : t("disabledBadge")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{t("githubDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {toggling === "auth_github_enabled" ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
            <Switch
              checked={isGithubChecked}
              onCheckedChange={(checked) => void handleToggle("auth_github_enabled", checked)}
              disabled={!canUpdate || isPending || Boolean(toggling)}
              data-testid="toggle-github-auth-switch"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
