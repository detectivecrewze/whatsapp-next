import {
  BRAND_VIDEO_FPS,
  BRAND_VIDEO_HEIGHT,
  BRAND_VIDEO_WIDTH,
  getBrandDurationInFrames,
} from '@/lib/brandTemplates';
import { BrandVideo } from '@/remotion/brand/BrandVideo';
import type { BrandVideoProps } from '@/types/brand';

async function prepareGifOverlaysForRender(props: BrandVideoProps) {
  const objectUrls: string[] = [];
  const gifOverlays = await Promise.all((props.gifOverlays ?? []).map(async (item) => {
    const source = item.url.trim();
    if (!item.enabled || !source || /^(data:|blob:|\/|\.\/)/i.test(source)) return item;

    const proxyUrl = source.includes('/api/brand/proxy-media')
      ? source
      : `/api/brand/proxy-media?url=${encodeURIComponent(source)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      const details = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(`${item.label || 'GIF'}: ${details?.error || `gagal dimuat (${response.status})`}`);
    }

    const remoteGif = await response.blob();
    if (!remoteGif.type.includes('image/gif')) {
      throw new Error(`${item.label || 'GIF'} tidak dikenali sebagai GIF animasi. Periksa direct link GIF-nya.`);
    }

    const objectUrl = URL.createObjectURL(remoteGif);
    objectUrls.push(objectUrl);
    return { ...item, url: objectUrl };
  }));

  return {
    props: { ...props, gifOverlays },
    objectUrls,
  };
}

export function brandVideoFileName(props: BrandVideoProps, suffix?: string) {
  const source = props.outputMode === 'hook' ? props.copy.hookTitle : props.copy.productName;
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'brand-video';
  const variantSuffix = suffix ? `-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
  return props.outputMode === 'hook'
    ? `${normalized}${variantSuffix}-hook-1080p.mp4`
    : `${normalized}${variantSuffix}-9x16.mp4`;
}

export async function assertBrandRenderSupport() {
  const { canRenderMediaOnWeb } = await import('@remotion/web-renderer');
  const support = await canRenderMediaOnWeb({
    container: 'mp4',
    videoCodec: 'h264',
    audioCodec: 'aac',
    muted: false,
    width: BRAND_VIDEO_WIDTH,
    height: BRAND_VIDEO_HEIGHT,
  });

  if (!support.canRender) {
    const reason = support.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message)
      .join(' ');
    throw new Error(reason || 'Browser belum mendukung export MP4. Gunakan Chrome atau Edge terbaru.');
  }
}

export async function renderBrandVideo(
  props: BrandVideoProps,
  onProgress?: (progress: number) => void,
) {
  const { renderMediaOnWeb } = await import('@remotion/web-renderer');
  const durationInFrames = getBrandDurationInFrames(props);
  const localized = await prepareGifOverlaysForRender(props);

  try {
    const result = await renderMediaOnWeb({
      licenseKey: 'free-license',
      composition: {
        id: 'FYABrandVideo',
        component: BrandVideo,
        durationInFrames,
        fps: BRAND_VIDEO_FPS,
        width: BRAND_VIDEO_WIDTH,
        height: BRAND_VIDEO_HEIGHT,
        calculateMetadata: null,
        defaultProps: localized.props,
      },
      inputProps: localized.props,
      container: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      audioBitrate: 192_000,
      sampleRate: 48_000,
      muted: false,
      videoBitrate: 12_000_000,
      hardwareAcceleration: 'prefer-hardware',
      pageResponsiveness: 'medium',
      delayRenderTimeoutInMilliseconds: 120_000,
      onProgress: ({ progress }) => onProgress?.(Math.round(Math.max(0, Math.min(1, progress)) * 100)),
    });
    return result.getBlob();
  } finally {
    localized.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
}

export function downloadBrandVideo(blob: Blob, props: BrandVideoProps, suffix?: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = brandVideoFileName(props, suffix);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
