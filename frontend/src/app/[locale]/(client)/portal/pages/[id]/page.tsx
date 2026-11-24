import { PortalPageEditView } from "@/modules/portal/views/page/portal-page-edit-view";

export default async function PortalPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalPageEditView id={id} />;
}
