import type { BrandGifOverlayItem } from '@/types/brand';

/** Small stagger keeps the opening frame clean while stickers still arrive quickly. */
export function getDefaultBrandGifStartSeconds(index: number) {
  return Math.min(0.8 + Math.max(0, index) * 0.55, 3.5);
}

export function getBrandGifStartSeconds(item: BrandGifOverlayItem, index: number) {
  return Math.max(0, item.startAtSeconds ?? getDefaultBrandGifStartSeconds(index));
}
