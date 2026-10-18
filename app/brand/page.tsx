import type { Metadata } from 'next';
import BrandStudioClient from '@/components/brand/BrandStudioClient';

export const metadata: Metadata = {
  title: 'Brand Video Studio · For You, Always',
  description: 'Buat video campaign vertikal berbasis template Remotion.',
};

export default function BrandStudioPage() {
  return <BrandStudioClient />;
}
