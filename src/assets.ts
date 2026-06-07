// Asset path helpers + the "easy images" system (§7 of CLAUDE.md). Art is optional:
// drop public/assets/cards/<card_id>.webp and it appears — no code change. A missing file
// falls back to the placeholder frame rendered by Card.tsx.
import type { CardDef } from '@engine/types';

/** Optional remote/CDN manifest consulted before the local path (community packs, Supabase). */
let artManifest: Record<string, string> = {};

export function setArtManifest(manifest: Record<string, string>): void {
  artManifest = manifest;
}

// Vite's base path ('/' in dev, '/Nightfall/' on Pages). Keeps asset URLs correct under
// a repo subpath so art/audio resolve no matter where the app is hosted.
const BASE = import.meta.env.BASE_URL;

export function resolveCardArt(card: CardDef): string {
  const key = card.art ?? card.id;
  if (artManifest[key]) return artManifest[key];
  return `${BASE}assets/cards/${key}.webp`;
}

export function resolvePortrait(characterId: string): string {
  return `${BASE}assets/art/portraits/${characterId}.webp`;
}

export function resolveTile(tileId: string): string {
  return `${BASE}assets/art/tiles/${tileId}.webp`;
}
