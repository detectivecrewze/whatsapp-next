import type { Metadata } from 'next';
import LetterHookStudio from '@/components/brand/LetterHookStudio';

export const metadata: Metadata = {
  title: 'Surat Kehidupan · Hook Maker',
  description: 'Buat video hook puitis dengan suasana surat digital yang personal.',
};

export default function LetterHookPage() {
  return <LetterHookStudio />;
}
