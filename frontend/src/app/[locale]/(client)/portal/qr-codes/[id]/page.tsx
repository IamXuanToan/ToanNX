import { PortalQrCodeEditView } from "@/modules/portal/views/qr-code/portal-qr-code-edit-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";

export default async function PortalQrCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PortalQrCodeEditView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.qrCodes}/${id}/history`}
          fieldPrefix="utilities.qrCodes.fields"
        />
      }
    />
  );
}
