// Run setup & the "every game is different" engine (§6 of design-doc.md). A run's
// variability — which Lords, their mutations, district order, objectives, events — is
// rolled once from the seed and stored in RunConfig (§5: deterministic).
import type { RunConfig } from './types';
import { Rng } from './rng';
import { lords } from '@data/lords';
import { mutations } from '@data/mutations';
import { districts } from '@data/districts';
import { events } from '@data/events';
import { districtsById } from '@data/districts';

export interface RunOptions {
  seed: string;
  crew: string[]; // character ids
  lordCount?: number; // how many Lords before the Eclipse Heart (default 3)
}

/** Roll a full run configuration deterministically from the seed. */
export function createRunConfig(opts: RunOptions): RunConfig {
  const { seed, crew } = opts;
  const lordCount = opts.lordCount ?? 3;
  const rng = new Rng(seed, 0);

  const lordSequence = rng.shuffle(lords.map((l) => l.id)).slice(0, lordCount);

  const mutationMap: Record<string, string> = {};
  for (const lordId of lordSequence) {
    mutationMap[lordId] = rng.pick(mutations).id;
  }

  const districtOrder = rng.shuffle(districts.map((d) => d.id)).slice(0, lordCount);

  const objectiveMap: Record<string, string> = {};
  lordSequence.forEach((lordId, i) => {
    const district = districtsById[districtOrder[i]];
    objectiveMap[lordId] = rng.pick(district.objectivePool);
  });

  // One Event drawn between districts (after each Lord except the last → before the Heart).
  const eventList: string[] = [];
  for (let i = 0; i < lordCount; i++) {
    eventList.push(rng.pick(events).id);
  }

  return {
    lordSequence,
    mutations: mutationMap,
    districts: districtOrder,
    objectives: objectiveMap,
    events: eventList,
    crew,
  };
}
