'use client';

import dynamic from 'next/dynamic';

const BrandStudio = dynamic(() => import('./BrandStudio'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        background: '#0d1117',
        color: 'rgba(255, 255, 255, 0.72)',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}>
          Memuat Brand Studio…
        </p>
      </div>
    </div>
  ),
});

export default function BrandStudioClient() {
  return <BrandStudio />;
}
