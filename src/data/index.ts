// Content registry + validation. Import from here, not the individual files, so that
// validateContent() can guard every load (§11). A bad data file fails loudly in dev.
import { z } from 'zod';
import {
  archetypeSchema,
  cardSchema,
  characterSchema,
  enemySchema,
  lordSchema,
  mutationSchema,
  districtSchema,
  eventSchema,
  threatCardSchema,
  objectiveSchema,
} from './schema';
import { archetypes } from './archetypes';
import { cards, cardsById } from './cards';
import { characters, charactersById } from './characters';
import { enemies, enemiesById } from './enemies';
import { lords, eclipseHeart, lordsById } from './lords';
import { mutations, mutationsById } from './mutations';
import { districts, finaleDistrict, districtsById } from './districts';
import { events, eventsById } from './events';
import { threatCards, threatCardsById, buildThreatDeck } from './threatDeck';
import { objectives, objectivesById } from './objectives';

export {
  archetypes,
  cards,
  cardsById,
  characters,
  charactersById,
  enemies,
  enemiesById,
  lords,
  eclipseHeart,
  lordsById,
  mutations,
  mutationsById,
  districts,
  finaleDistrict,
  districtsById,
  events,
  eventsById,
  threatCards,
  threatCardsById,
  buildThreatDeck,
  objectives,
  objectivesById,
};

export class ContentError extends Error {}

function parseAll<T>(schema: z.ZodType<T>, items: unknown[], label: string): void {
  items.forEach((item, i) => {
    const res = schema.safeParse(item);
    if (!res.success) {
      throw new ContentError(
        `Invalid ${label}[${i}]: ${res.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`,
      );
    }
  });
}

/**
 * Validate every content collection against its Zod schema and check referential
 * integrity (card ids referenced by archetypes/characters exist, etc.). Call once at
 * startup; throws ContentError on any problem.
 */
export function validateContent(): void {
  parseAll(archetypeSchema, archetypes, 'archetype');
  parseAll(cardSchema, cards, 'card');
  parseAll(characterSchema, characters, 'character');
  parseAll(enemySchema, enemies, 'enemy');
  parseAll(lordSchema, [...lords, eclipseHeart], 'lord');
  parseAll(mutationSchema, mutations, 'mutation');
  parseAll(districtSchema, [...districts, finaleDistrict], 'district');
  parseAll(eventSchema, events, 'event');
  parseAll(threatCardSchema, threatCards, 'threatCard');
  parseAll(objectiveSchema, objectives, 'objective');

  // Unique card ids.
  const seen = new Set<string>();
  for (const c of cards) {
    if (seen.has(c.id)) throw new ContentError(`Duplicate card id: ${c.id}`);
    seen.add(c.id);
  }

  const cardExists = (id: string) => id in cardsById;

  // Archetype spines reference real cards.
  for (const a of archetypes) {
    for (const id of a.spine) {
      if (!cardExists(id)) throw new ContentError(`Archetype ${a.id} spine references missing card ${id}`);
    }
  }

  // Characters reference real cards, and their cards belong to their archetype.
  for (const ch of characters) {
    const refs = [ch.inherent, ...ch.personal, ch.ultimate];
    for (const id of refs) {
      if (!cardExists(id)) throw new ContentError(`Character ${ch.id} references missing card ${id}`);
      if (cardsById[id].archetype !== ch.archetype) {
        throw new ContentError(`Character ${ch.id} card ${id} is not archetype ${ch.archetype}`);
      }
    }
    if (!archetypes.some((a) => a.id === ch.archetype)) {
      throw new ContentError(`Character ${ch.id} has unknown archetype ${ch.archetype}`);
    }
  }

  // District zone adjacency is symmetric and references real zones.
  for (const d of [...districts, finaleDistrict]) {
    const ids = new Set(d.zones.map((z) => z.id));
    for (const z of d.zones) {
      for (const adj of z.adjacent) {
        if (!ids.has(adj)) throw new ContentError(`District ${d.id} zone ${z.id} adjacent to missing ${adj}`);
        const back = d.zones.find((o) => o.id === adj);
        if (!back || !back.adjacent.includes(z.id)) {
          throw new ContentError(`District ${d.id} adjacency ${z.id}<->${adj} is not symmetric`);
        }
      }
    }
    for (const sp of d.spawnZones) {
      if (!ids.has(sp)) throw new ContentError(`District ${d.id} spawn zone ${sp} missing`);
    }
    for (const obj of d.objectivePool) {
      if (!(obj in objectivesById)) throw new ContentError(`District ${d.id} objective ${obj} missing`);
    }
  }
}

void threatCardsById;
void mutationsById;
void eventsById;
void lordsById;
void enemiesById;
void districtsById;
