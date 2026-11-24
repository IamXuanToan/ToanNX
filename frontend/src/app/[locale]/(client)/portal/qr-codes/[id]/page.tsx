import { PortalQrCodeEditView } from "@/modules/portal/views/qr-code/portal-qr-code-edit-view";

export default async function PortalQrCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalQrCodeEditView id={id} />;
}
