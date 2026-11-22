import { NovelReaderView } from "@/modules/novel/views/reader/novel-reader-view";

type PageProps = {
  params: Promise<{ slug: string; chapterNumber: string }>;
};

export default async function NovelReaderPage({ params }: PageProps) {
  const { slug, chapterNumber } = await params;
  return <NovelReaderView novelSlug={slug} chapterNumber={chapterNumber} />;
}
