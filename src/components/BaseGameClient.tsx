'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { useGameConfig } from '@/hooks/useGameConfig';
import { ProjectionConfig, useGameProjection } from '@/hooks/useGameProjection';

interface BaseGameClientProps {
  useMapData: () => { data: any; status: 'pending' | 'success' | 'error' };
  configKey: string;
  duration?: number;
  durationKey?: string;
  gameKey: string;
  projectionConfig: ProjectionConfig;
  showOnlyValid?: boolean;
  gameMode?: 'name' | 'capital';
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

  // Dynamically resolve capitals variables for capital modes
  const isCapitalMode = gameKey.includes('capitals') || gameModeProp === 'capital';
  const capitalMap = isCapitalMode
    ? (gameKey === 'us-capitals' ? config?.US_CAPITALS : config?.SOUTH_AMERICA_CAPITALS)
    : undefined;
  const capitalCoordinates = isCapitalMode ? config?.CAPITAL_COORDINATES : undefined;

  if (mapStatus === 'pending' || configStatus === 'pending') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f1f5f3]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }
  
  const finalDuration = (durationKey && config?.[durationKey]) || duration || 300;

  return (
    <QuizLayout
      title={t(`gameData.${gameKey}.title`)}
      description={t(`gameData.${gameKey}.description`)}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={finalDuration}
      showOnlyValid={showOnlyValid}
      gameMode={isCapitalMode ? 'capital' : 'name'}
      capitalMap={capitalMap}
      capitalCoordinates={capitalCoordinates}
    />
  );
}
