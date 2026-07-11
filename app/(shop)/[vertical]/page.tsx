import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerticalView } from '@/components/vertical/VerticalView';
import { VERTICAL_SLUGS, getVertical } from '@/lib/verticals';

export function generateStaticParams() {
  return VERTICAL_SLUGS.map((vertical) => ({ vertical }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  const v = getVertical(vertical);
  return v ? { title: `${v.label} — PlantAtHome`, description: v.blurb } : {};
}

export default async function VerticalPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (!VERTICAL_SLUGS.includes(vertical)) return notFound();
  return <VerticalView slug={vertical} />;
}
