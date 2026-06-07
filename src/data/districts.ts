// District maps + objective pools (§6.C of design-doc.md). Each Lord sits in a drawn
// district. Maps are small zone graphs; terrain seeds the lit/shadow/flooded board.
import type { DistrictDef } from '@engine/types';

export const districts: DistrictDef[] = [
  {
    id: 'drowned_harbor',
    name: 'The Drowned Harbor',
    zones: [
      { id: 'wharf', name: 'The Wharf', terrain: 'lit', adjacent: ['pier', 'nets'] },
      { id: 'pier', name: 'Rotted Pier', terrain: 'shadow', adjacent: ['wharf', 'deepwater'] },
      { id: 'nets', name: 'Net Yards', terrain: 'shadow', adjacent: ['wharf', 'deepwater'] },
      { id: 'deepwater', name: 'Deepwater', terrain: 'flooded', adjacent: ['pier', 'nets', 'hull'] },
      { id: 'hull', name: 'The Broken Hull', terrain: 'shadow', adjacent: ['deepwater'] },
    ],
    objectivePool: ['restore_streetlights', 'destroy_blood_font', 'hold_position'],
    spawnZones: ['hull', 'deepwater'],
  },
  {
    id: 'cathedral_square',
    name: 'Cathedral Square',
    zones: [
      { id: 'steps', name: 'Cathedral Steps', terrain: 'lit', adjacent: ['nave', 'plaza'] },
      { id: 'nave', name: 'The Nave', terrain: 'shadow', adjacent: ['steps', 'altar'] },
      { id: 'plaza', name: 'Flooded Plaza', terrain: 'flooded', adjacent: ['steps', 'crypt'] },
      { id: 'altar', name: 'The Altar', terrain: 'shadow', adjacent: ['nave', 'crypt'] },
      { id: 'crypt', name: 'The Crypt', terrain: 'shadow', adjacent: ['plaza', 'altar'] },
    ],
    objectivePool: ['restore_streetlights', 'escort_survivor', 'hold_position'],
    spawnZones: ['crypt', 'altar'],
  },
  {
    id: 'old_garden',
    name: 'The Overgrown Garden',
    zones: [
      { id: 'gate', name: 'Iron Gate', terrain: 'lit', adjacent: ['hedge', 'fountain'] },
      { id: 'hedge', name: 'Hedge Maze', terrain: 'shadow', adjacent: ['gate', 'grove'] },
      { id: 'fountain', name: 'Dry Fountain', terrain: 'shadow', adjacent: ['gate', 'grove'] },
      { id: 'grove', name: 'Thorn Grove', terrain: 'shadow', adjacent: ['hedge', 'fountain', 'roots'] },
      { id: 'roots', name: 'The Root Cellar', terrain: 'flooded', adjacent: ['grove'] },
    ],
    objectivePool: ['escort_survivor', 'destroy_blood_font', 'hold_position'],
    spawnZones: ['roots', 'grove'],
  },
  {
    id: 'iron_foundry',
    name: 'The Iron Foundry',
    zones: [
      { id: 'gateyard', name: 'Gate Yard', terrain: 'lit', adjacent: ['floor', 'coalpit'] },
      { id: 'floor', name: 'Furnace Floor', terrain: 'shadow', adjacent: ['gateyard', 'catwalk'] },
      { id: 'coalpit', name: 'Coal Pit', terrain: 'shadow', adjacent: ['gateyard', 'catwalk'] },
      { id: 'catwalk', name: 'The Catwalk', terrain: 'shadow', adjacent: ['floor', 'coalpit', 'crucible'] },
      { id: 'crucible', name: 'The Crucible', terrain: 'shadow', adjacent: ['catwalk'] },
    ],
    objectivePool: ['destroy_blood_font', 'hold_position', 'restore_streetlights'],
    spawnZones: ['crucible', 'catwalk'],
  },
  {
    id: 'bell_quarter',
    name: 'The Bell Quarter',
    zones: [
      { id: 'market', name: 'Night Market', terrain: 'lit', adjacent: ['alley', 'belfry_base'] },
      { id: 'alley', name: 'Hanging Alley', terrain: 'shadow', adjacent: ['market', 'stair'] },
      { id: 'belfry_base', name: 'Belfry Base', terrain: 'shadow', adjacent: ['market', 'stair'] },
      { id: 'stair', name: 'Spiral Stair', terrain: 'shadow', adjacent: ['alley', 'belfry_base', 'belfry'] },
      { id: 'belfry', name: 'The Belfry', terrain: 'shadow', adjacent: ['stair'] },
    ],
    objectivePool: ['restore_streetlights', 'escort_survivor', 'hold_position'],
    spawnZones: ['belfry', 'stair'],
  },
  {
    id: 'sunken_row',
    name: 'Sunken Row',
    zones: [
      { id: 'levee', name: 'The Levee', terrain: 'lit', adjacent: ['porches', 'canal'] },
      { id: 'porches', name: 'Drowned Porches', terrain: 'flooded', adjacent: ['levee', 'chapel'] },
      { id: 'canal', name: 'Black Canal', terrain: 'flooded', adjacent: ['levee', 'chapel'] },
      { id: 'chapel', name: 'Half-Sunk Chapel', terrain: 'shadow', adjacent: ['porches', 'canal', 'depths'] },
      { id: 'depths', name: 'The Depths', terrain: 'flooded', adjacent: ['chapel'] },
    ],
    objectivePool: ['escort_survivor', 'destroy_blood_font', 'hold_position'],
    spawnZones: ['depths', 'chapel'],
  },
];

export const districtsById: Record<string, DistrictDef> = Object.fromEntries(
  districts.map((d) => [d.id, d]),
);
