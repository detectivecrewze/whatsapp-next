import { Metadata } from 'next';
import PreviewClient from './PreviewClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Preview WA — ${id}`,
    description: 'Preview animasi WhatsApp viral',
    openGraph: {
      title: 'WhatsApp Chat Preview 📱',
      description: 'Tonton animasi percakapan WhatsApp viral ini!',
      type: 'website',
    },
  };
}

export default async function PreviewPage({ params }: Props) {
  const { id } = await params;
  return <PreviewClient presetId={id} />;
}
