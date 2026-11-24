import { PortalShortLinkEditView } from "@/modules/portal/views/short-link/portal-short-link-edit-view";

export default async function PortalShortLinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalShortLinkEditView id={id} />;
}
