"use client";

import { Copy, ExternalLink, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { SHORT_LINK_CARD_TYPE } from "../../constants/defaults";
import type { AssistantResultCard as AssistantResultCardData } from "../../types/assistant.types";
import { useAssistantResultCard } from "./hooks/use-assistant-result-card";

/**
 * Nút thao tác cho thẻ kết quả (link rút gọn): sao chép và mở đúng URL thật server đã dựng.
 *
 * @param props - Dữ liệu thẻ.
 * @returns Hàng nút thao tác.
 */
export function AssistantResultCard({ card }: { card: AssistantResultCardData }) {
  const t = useTranslations("workspace.assistant.resultCard");
  const { copy } = useAssistantResultCard();
  const isShortLink = card.type === SHORT_LINK_CARD_TYPE;
  const viewUrl = card.viewUrl || card.url;
  if (!viewUrl) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1" data-testid="assistant-result-card">
      {isShortLink ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => copy(card.url)}
            className="h-7 gap-1 rounded-full px-2.5 text-xs"
          >
            <Copy className="size-3.5" aria-hidden />
            {t("copyLink")}
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-full px-2.5 text-xs"
          >
            <Link href={card.url as never} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" aria-hidden />
              {t("openLink")}
            </Link>
          </Button>
        </>
      ) : null}
      <Button asChild variant="outline" size="sm" className="h-7 gap-1 rounded-full px-2.5 text-xs">
        <Link href={viewUrl as never}>
          <Eye className="size-3.5" aria-hidden />
          {t("viewDetail")}
        </Link>
      </Button>
    </div>
  );
}
