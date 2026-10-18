import type { Metadata } from 'next';
import BrandStudio from '@/components/brand/BrandStudio';

export const metadata: Metadata = {
  title: 'Brand Video Studio · For You, Always',
  description: 'Buat video campaign vertikal berbasis template Remotion.',
};

export default function BrandStudioPage() {
  return <BrandStudio />;
}

