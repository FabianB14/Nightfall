// Asset path helpers + the "easy images" system (§7 of CLAUDE.md). Art is optional:
// drop public/assets/cards/<card_id>.webp and it appears — no code change. A missing file
// falls back to the placeholder frame rendered by Card.tsx.
import type { CardDef } from '@engine/types';

/** Optional remote/CDN manifest consulted before the local path (community packs, Supabase). */
let artManifest: Record<string, string> = {};

export function setArtManifest(manifest: Record<string, string>): void {
  artManifest = manifest;
}

export function resolveCardArt(card: CardDef): string {
  const key = card.art ?? card.id;
  if (artManifest[key]) return artManifest[key];
  return `/assets/cards/${key}.webp`;
}

export function resolvePortrait(characterId: string): string {
  return `/assets/art/portraits/${characterId}.webp`;
}

export function resolveTile(tileId: string): string {
  return `/assets/art/tiles/${tileId}.webp`;
}
