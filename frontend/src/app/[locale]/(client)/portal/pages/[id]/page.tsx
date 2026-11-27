import { PortalPageEditView } from "@/modules/portal/views/page/portal-page-edit-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";

export default async function PortalPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PortalPageEditView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.pages}/${id}/history`}
          fieldPrefix="utilities.customPages.pages.fields"
        />
      }
    />
  );
}
