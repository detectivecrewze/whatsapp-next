import { canRenderMediaOnWeb, renderMediaOnWeb } from '@remotion/web-renderer';
import { LetterHookVideo, type LetterHookProps } from '@/remotion/brand/LetterHookVideo';

export const LETTER_HOOK_WIDTH = 1080;
export const LETTER_HOOK_HEIGHT = 1920;
export const LETTER_HOOK_FPS = 30;

export function letterHookFileName(props: LetterHookProps): string {
  const source = props.line1 || props.label || 'surat-kehidupan';
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'surat-kehidupan';
  return `pba-${slug}.mp4`;
}

export interface RenderSupportResult {
  useMuted: boolean;
}

export async function assertLetterHookRenderSupport(): Promise<RenderSupportResult> {

  // 1. Coba verifikasi dengan audio AAC (standar MP4 video dengan audio track)
  try {
    const support = await canRenderMediaOnWeb({
      container: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      muted: false,
      width: LETTER_HOOK_WIDTH,
      height: LETTER_HOOK_HEIGHT,
    });

    if (support.canRender) {
      return { useMuted: false };
    }
  } catch {
    // Abaikan jika pengecekan audio AAC menghasilkan exception, lanjutkan ke fallback muted
  }

  // 2. Fallback: Coba verifikasi dengan muted (video-only) jika browser tidak mendukung AAC encoder
  const mutedSupport = await canRenderMediaOnWeb({
    container: 'mp4',
    videoCodec: 'h264',
    muted: true,
    width: LETTER_HOOK_WIDTH,
    height: LETTER_HOOK_HEIGHT,
  });

  if (mutedSupport.canRender) {
    return { useMuted: true };
  }

  const reason = mutedSupport.issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.message)
    .join(' ');

  throw new Error(
    reason ||
      'Browser belum mendukung export MP4 melalui WebCodecs. Gunakan browser Google Chrome atau Microsoft Edge versi terbaru di Desktop/Laptop.',
  );
}

export async function renderLetterHookVideo(
  props: LetterHookProps,
  durationInFrames: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const { useMuted } = await assertLetterHookRenderSupport();

  // Sanitasi props agar tidak ada media src kosong atau anomali
  const hasValidMedia = props.bgMode === 'media' && Boolean(props.bgMedia?.src && props.bgMedia.src.trim().length > 0);
  const sanitizedProps: LetterHookProps = {
    ...props,
    bgMode: hasValidMedia ? 'media' : 'color',
    bgMedia: hasValidMedia
      ? {
          ...props.bgMedia!,
          name: props.bgMedia?.name || 'media',
        }
      : undefined,
  };

  const audioOptions = useMuted
    ? {
        muted: true as const,
      }
    : {
        muted: false as const,
        audioCodec: 'aac' as const,
        audioBitrate: 192_000,
        sampleRate: 48_000,
      };

  const result = await renderMediaOnWeb({
    licenseKey: 'free-license',
    composition: {
      id: 'FYALetterHook',
      component: LetterHookVideo,
      durationInFrames,
      fps: LETTER_HOOK_FPS,
      width: LETTER_HOOK_WIDTH,
      height: LETTER_HOOK_HEIGHT,
      calculateMetadata: null,
      defaultProps: sanitizedProps,
    },
    inputProps: sanitizedProps,
    container: 'mp4',
    videoCodec: 'h264',
    videoBitrate: 12_000_000,
    hardwareAcceleration: 'prefer-hardware',
    pageResponsiveness: 'medium',
    delayRenderTimeoutInMilliseconds: 120_000,
    ...audioOptions,
    onProgress: ({ progress }) => {
      onProgress?.(Math.round(Math.max(0, Math.min(1, progress)) * 100));
    },
  });

  return result.getBlob();
}

export function downloadLetterHookVideo(blob: Blob, props: LetterHookProps): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = letterHookFileName(props);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
