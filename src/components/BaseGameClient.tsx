'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { useGameConfig } from '@/hooks/useGameConfig';
import { ProjectionConfig, useGameProjection } from '@/hooks/useGameProjection';

// Maps a capital/reverse gameKey to the config key holding its
// region-name -> capital-name lookup table. Add an entry here whenever a
// new capital-based game is wired up.
const CAPITAL_CONFIG_KEYS: Record<string, string> = {
  'us-capitals': 'US_CAPITALS',
  'sa-capitals': 'SOUTH_AMERICA_CAPITALS',
  'europe-capitals': 'EUROPE_CAPITALS',
  'europe-capitals-reverse': 'EUROPE_CAPITALS',
  'us-capitals-reverse': 'US_CAPITALS',
};

interface BaseGameClientProps {
  useMapData: () => { data: any; status: 'pending' | 'success' | 'error' };
  configKey: string;
  duration?: number;
  durationKey?: string;
  gameKey: string;
  projectionConfig: ProjectionConfig;
  showOnlyValid?: boolean;
  gameMode?: 'name' | 'capital' | 'flag' | 'reverse';
}

export default function BaseGameClient({
  useMapData,
  configKey,
  duration,
  durationKey,
  gameKey,
  projectionConfig,
  showOnlyValid,
  gameMode: gameModeProp,
}: BaseGameClientProps) {
  const { data: mapData, status: mapStatus } = useMapData();
  const { data: config, status: configStatus } = useGameConfig();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = useGameProjection(mapData, projectionConfig);

  const localizedValidNames = useMemo(() => {
    if (!config || !config[configKey]) return [];
    const regionNames = config[configKey];
    const names = [...regionNames];
    regionNames.forEach((name: string) => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch {
        /* ignore */
      }
    });
    return names;
  }, [tRegions, config, configKey]);

  // Dynamically resolve capitals variables for capital/reverse modes. Each
  // capital-driven gameKey maps to the config key holding its
  // region-name -> capital-name lookup table.
  const isCapitalMode = gameKey.includes('capitals') || gameModeProp === 'capital' || gameModeProp === 'reverse';
  const capitalMap = isCapitalMode ? config?.[CAPITAL_CONFIG_KEYS[gameKey]] : undefined;
  const capitalCoordinates = isCapitalMode ? config?.CAPITAL_COORDINATES : undefined;

  if (mapStatus === 'pending' || configStatus === 'pending') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }
  
  const finalDuration = (durationKey && config?.[durationKey]) || duration || 300;

  return (
    <QuizLayout
      gameKey={gameKey}
      title={t(`gameData.${gameKey}.title`)}
      description={t(`gameData.${gameKey}.description`)}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={finalDuration}
      showOnlyValid={showOnlyValid}
      gameMode={gameModeProp}
      capitalMap={capitalMap}
      capitalCoordinates={capitalCoordinates}
    />
  );
}
