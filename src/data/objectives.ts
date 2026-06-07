// District objectives (§6.C of design-doc.md). One is drawn per district.
import type { ObjectiveDef } from '@engine/types';

export const objectives: ObjectiveDef[] = [
  {
    id: 'restore_streetlights',
    name: 'Restore the Streetlights',
    text: 'Light 3 shadow zones to power the district back on.',
  },
  {
    id: 'escort_survivor',
    name: 'Escort a Survivor',
    text: 'Move a survivor token from the spawn to the exit zone.',
  },
  {
    id: 'destroy_blood_font',
    name: 'Destroy the Blood Font',
    text: 'Break the blood font (6 HP) feeding the Lord before it Enrages.',
  },
  {
    id: 'hold_position',
    name: 'Hold a Position',
    text: 'Keep a hunter in the marked zone for 3 consecutive rounds.',
  },
];

export const objectivesById: Record<string, ObjectiveDef> = Object.fromEntries(
  objectives.map((o) => [o.id, o]),
);
