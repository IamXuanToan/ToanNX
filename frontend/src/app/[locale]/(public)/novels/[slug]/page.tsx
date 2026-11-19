import { NovelDetailView } from "@/modules/novel/views/novel-detail-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NovelDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <NovelDetailView slug={slug} />;
}
