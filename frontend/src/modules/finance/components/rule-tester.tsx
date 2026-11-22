"use client";

import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";

import { useRuleTester } from "./hooks/use-rule-tester";

/**
 * Ô "Thử nội dung": chạy regex đang soạn (hoặc mọi quy tắc của mình) trên nội dung chuyển khoản mẫu.
 *
 * @param props - Regex đang soạn.
 * @returns Ô thử.
 */
export function RuleTester({ pattern }: { pattern?: string }) {
  const t = useTranslations("finance.rules.tester");
  const state = useRuleTester(pattern);
  const result = state.result;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={state.content}
          onChange={(event) => state.setContent(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={state.run}
          disabled={!state.content.trim() || state.isRunning}
        >
          <FlaskConical />
          {t("run")}
        </Button>
      </div>
      {result ? (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            {t("normalized")}: <code>{result.normalized}</code>
          </p>
          {result.matchedText ? (
            <p className="text-success">
              {t("matched", { text: result.matchedText })}
              {result.platformName ? ` → ${result.platformName}` : ""}
            </p>
          ) : (
            <p className="text-warning">{t("notMatched")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
