"use client";

import { Check, Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { FormSection } from "@/shares/components/common/form-section";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { buildBotFatherCommandsText, resolveCommandSpecForLocale } from "../../constants/defaults";
import type { AssistantCommand } from "../../types/assistant.types";

/**
 * Thẻ hiển thị danh sách câu lệnh có sẵn của Bot để Admin khai báo vào `@BotFather /setcommands`
 * trên Telegram, đặt trong cột phụ (`FormLayout aside`) theo chuẩn form Admin.
 *
 * @param props - Danh sách câu lệnh từ API cấu hình Chatbot AI.
 * @returns Card `FormSection` liệt kê câu lệnh & nút sao chép.
 */
export function AssistantTelegramCommandsCard({
  commands,
}: {
  commands: readonly AssistantCommand[];
}) {
  const t = useTranslations("workspace.assistantAdmin.telegramCommands");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const botFatherText = buildBotFatherCommandsText(commands, locale);

  async function handleCopy() {
    if (!botFatherText) return;
    try {
      await navigator.clipboard.writeText(botFatherText);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <FormSection
      title={t("title")}
      headerAction={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          disabled={commands.length === 0}
          data-testid="copy-botfather-commands-btn"
          className="h-8 gap-1.5 text-xs"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t("copiedShort") : t("copy")}
        </Button>
      }
    >
      <p className="text-muted-foreground text-xs leading-relaxed">{t("description")}</p>

      <ul className="divide-border/60 divide-y rounded-lg border" data-testid="admin-command-list">
        {commands.map((item) => {
          const { primary, secondary, syntax, description } = resolveCommandSpecForLocale(
            item,
            locale,
          );
          return (
            <li key={item.canonical} className="space-y-1 px-3 py-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <code className="text-primary font-mono font-semibold">{primary}</code>
                <div className="flex items-center gap-1">
                  {item.telegramOnly ? (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {t("telegramOnlyBadge")}
                    </Badge>
                  ) : null}
                  <code className="text-muted-foreground font-mono text-[11px]">{secondary}</code>
                </div>
              </div>
              <p className="text-foreground/90">{description}</p>
              {syntax !== primary ? (
                <p className="text-muted-foreground font-mono text-[11px]">{syntax}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">{t("botFatherBlockLabel")}</p>
        <pre
          data-testid="botfather-commands-block"
          className="bg-muted/50 text-foreground overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
        >
          {botFatherText}
        </pre>
      </div>
    </FormSection>
  );
}
