'use client';

import { useCallback } from 'react';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { seededPick, todayUTC } from '@/lib/dailySeed';

const DAILY_CHALLENGE_COUNT = 15;
const SECONDS_PER_COUNTRY = 15;

export default function DailyChallengeClient() {
  // Stable across the component's lifetime for a given day, so re-renders
  // don't reshuffle mid-session; a fresh pick only happens on a fresh load
  // after the date rolls over.
  const selectToday = useCallback(
    (names: string[]) => seededPick(names, DAILY_CHALLENGE_COUNT, todayUTC()),
    []
  );

  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="WORLD_COUNTRIES"
      gameKey="daily-challenge"
      gameMode="name"
      duration={DAILY_CHALLENGE_COUNT * SECONDS_PER_COUNTRY}
      projectionConfig={{
        type: 'mercator',
        scale: 150,
      }}
      showOnlyValid={true}
      selectNames={selectToday}
      shareResults={true}
    />
  );
}
