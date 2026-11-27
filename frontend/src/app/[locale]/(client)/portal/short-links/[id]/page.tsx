import { PortalShortLinkEditView } from "@/modules/portal/views/short-link/portal-short-link-edit-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";

export default async function PortalShortLinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PortalShortLinkEditView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.shortLinks}/${id}/history`}
          fieldPrefix="utilities.shortLinks.fields"
        />
      }
    />
  );
}
