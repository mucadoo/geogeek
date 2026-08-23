import { Map, MapPin, Globe, MousePointerClick, Type, Repeat, Flag } from 'lucide-react';

import { GameCategory } from '@/types';

export type MechanicId = 'map-click' | 'type-capital' | 'reverse-capital' | 'flag-id';

export interface Mechanic {
  id: MechanicId;
  icon: typeof Map;
  label: string;
  description: string;
}

// Every game is one of a small set of underlying mechanics, applied to a
// different region/dataset. Grouping the games page by mechanic (rather than
// a flat grid) is what makes the real variety of what's on offer legible,
// instead of reading as N reskins of the same quiz.
export const mechanics: Mechanic[] = [
  {
    id: 'map-click',
    icon: MousePointerClick,
    label: 'Name the Region',
    description: 'We call out a place — click it on the map before time runs out.',
  },
  {
    id: 'type-capital',
    icon: Type,
    label: 'Type the Capital',
    description: 'See a region highlighted, type its capital city from memory.',
  },
  {
    id: 'reverse-capital',
    icon: Repeat,
    label: 'Capital → Region',
    description: 'We show the capital — you find the matching country or state.',
  },
  {
    id: 'flag-id',
    icon: Flag,
    label: 'Flag ID',
    description: 'Match the flag shown to the right country on the map.',
  },
];

export interface GameListEntry {
  id: string;
  icon: typeof Map;
  href: string;
  color: string;
  category: GameCategory;
  mechanic: MechanicId;
  count: number;
  difficulty: number;
  /** Surfaced in the "New & Different" row on the games page. */
  featured?: boolean;
}

export const games: GameListEntry[] = [
  {
    id: 'world-countries',
    icon: Globe,
    href: '/games/world-countries',
    color: 'bg-cyan-600',
    category: GameCategory.CONTINENTS,
    mechanic: 'map-click',
    count: 173,
    difficulty: 3,
    featured: true,
  },
  {
    id: 'flag-game',
    icon: Flag,
    href: '/games/flag-game',
    color: 'bg-yellow-600',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 173,
    difficulty: 3,
    featured: true,
  },
  {
    id: 'europe-capitals-reverse',
    icon: MapPin,
    href: '/games/europe-capitals-reverse',
    color: 'bg-fuchsia-600',
    category: GameCategory.CAPITALS,
    mechanic: 'reverse-capital',
    count: 44,
    difficulty: 3,
    featured: true,
  },
  {
    id: 'us-capitals-reverse',
    icon: MapPin,
    href: '/games/us-capitals-reverse',
    color: 'bg-pink-600',
    category: GameCategory.CAPITALS,
    mechanic: 'reverse-capital',
    count: 50,
    difficulty: 3,
    featured: true,
  },
  {
    id: 'us-states',
    icon: Map,
    href: '/games/us-states',
    color: 'bg-blue-500',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 50,
    difficulty: 2,
  },
  {
    id: 'us-capitals',
    icon: MapPin,
    href: '/games/us-capitals',
    color: 'bg-indigo-500',
    category: GameCategory.CAPITALS,
    mechanic: 'type-capital',
    count: 50,
    difficulty: 3,
  },
  {
    id: 'sa-countries',
    icon: Globe,
    href: '/games/south-america-countries',
    color: 'bg-green-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'map-click',
    count: 12,
    difficulty: 1,
  },
  {
    id: 'sa-capitals',
    icon: MapPin,
    href: '/games/south-america-capitals',
    color: 'bg-emerald-600',
    category: GameCategory.CAPITALS,
    mechanic: 'type-capital',
    count: 12,
    difficulty: 2,
  },
  {
    id: 'europe-capitals',
    icon: MapPin,
    href: '/games/europe-capitals',
    color: 'bg-violet-600',
    category: GameCategory.CAPITALS,
    mechanic: 'type-capital',
    count: 44,
    difficulty: 3,
  },
  {
    id: 'brazil-states',
    icon: Map,
    href: '/games/brazil-states',
    color: 'bg-green-600',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 27,
    difficulty: 2,
  },
  {
    id: 'italy-regions',
    icon: Map,
    href: '/games/italy-regions',
    color: 'bg-red-500',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 20,
    difficulty: 2,
  },
  {
    id: 'france-regions',
    icon: Map,
    href: '/games/france-regions',
    color: 'bg-blue-600',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 18,
    difficulty: 2,
  },
  {
    id: 'canada-provinces',
    icon: Map,
    href: '/games/canada-provinces',
    color: 'bg-red-600',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 13,
    difficulty: 1,
  },
  {
    id: 'australia-states',
    icon: Map,
    href: '/games/australia-states',
    color: 'bg-amber-600',
    category: GameCategory.REGIONS,
    mechanic: 'map-click',
    count: 8,
    difficulty: 1,
  },
  {
    id: 'africa-flags',
    icon: Globe,
    href: '/games/africa-flags',
    color: 'bg-orange-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 54,
    difficulty: 3,
  },
  {
    id: 'asia-flags',
    icon: Globe,
    href: '/games/asia-flags',
    color: 'bg-red-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 48,
    difficulty: 3,
  },
  {
    id: 'europe-flags',
    icon: Globe,
    href: '/games/europe-flags',
    color: 'bg-blue-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 44,
    difficulty: 2,
  },
  {
    id: 'north-america-flags',
    icon: Globe,
    href: '/games/north-america-flags',
    color: 'bg-sky-600',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 23,
    difficulty: 2,
  },
  {
    id: 'oceania-flags',
    icon: Globe,
    href: '/games/oceania-flags',
    color: 'bg-teal-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 14,
    difficulty: 2,
  },
  {
    id: 'south-america-flags',
    icon: Globe,
    href: '/games/south-america-flags',
    color: 'bg-rose-500',
    category: GameCategory.CONTINENTS,
    mechanic: 'flag-id',
    count: 12,
    difficulty: 1,
  },
  {
    id: 'africa-capitals',
    icon: MapPin,
    href: '/games/africa-capitals',
    color: 'bg-lime-600',
    category: GameCategory.CAPITALS,
    mechanic: 'type-capital',
    count: 56,
    difficulty: 4,
  },
  {
    id: 'africa-capitals-reverse',
    icon: MapPin,
    href: '/games/africa-capitals-reverse',
    color: 'bg-purple-600',
    category: GameCategory.CAPITALS,
    mechanic: 'reverse-capital',
    count: 56,
    difficulty: 4,
  },
  {
    id: 'asia-capitals',
    icon: MapPin,
    href: '/games/asia-capitals',
    color: 'bg-orange-600',
    category: GameCategory.CAPITALS,
    mechanic: 'type-capital',
    count: 49,
    difficulty: 4,
  },
  {
    id: 'asia-capitals-reverse',
    icon: MapPin,
    href: '/games/asia-capitals-reverse',
    color: 'bg-cyan-500',
    category: GameCategory.CAPITALS,
    mechanic: 'reverse-capital',
    count: 49,
    difficulty: 4,
  },
];
