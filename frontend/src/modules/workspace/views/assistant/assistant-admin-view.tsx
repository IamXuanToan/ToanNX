"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { AssistantAdminPanel } from "../../components/assistant/assistant-admin-panel";
import { ASSISTANT_CONFIG_PERMISSIONS } from "../../permissions/assistant-config-permission";

/** View quản trị Chatbot AI dùng chung (`/quan-tri/he-thong/tro-ly-ai`). */
export function AssistantAdminView() {
  const canReadConfig = usePermission(ASSISTANT_CONFIG_PERMISSIONS.read);
  const canUpdateConfig = usePermission(ASSISTANT_CONFIG_PERMISSIONS.update);
  const canReadAttachments = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUploadAttachments = usePermission(ATTACHMENT_PERMISSIONS.create);

  if (!canReadConfig) return <ForbiddenView />;

  return (
    <AssistantAdminPanel
      canReadConfig={canReadConfig}
      canUpdateConfig={canUpdateConfig}
      canReadAttachments={canReadAttachments}
      canUploadAttachments={canUploadAttachments}
    />
  );
}
