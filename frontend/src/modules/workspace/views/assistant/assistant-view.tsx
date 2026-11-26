"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AssistantChat } from "../../components/assistant/assistant-chat";
import { ASSISTANT_CONVERSATION_PERMISSIONS } from "../../permissions/assistant-conversation-permission";
import { ASSISTANT_PERMISSIONS } from "../../permissions/assistant-permission";

/** @returns Trang Trợ lý AI cá nhân (Chat + Slash commands + lịch sử đa kênh). */
export function AssistantView() {
  const t = useTranslations("workspace.assistant");
  const canChat = usePermission(ASSISTANT_PERMISSIONS.chat);
  const canReadConversations = usePermission(ASSISTANT_CONVERSATION_PERMISSIONS.read);
  const canDeleteConversations = usePermission(ASSISTANT_CONVERSATION_PERMISSIONS.delete);

  if (!canChat && !canReadConversations) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <AssistantChat
        canChat={canChat}
        canReadConversations={canReadConversations}
        canDeleteConversations={canDeleteConversations}
      />
    </div>
  );
}
