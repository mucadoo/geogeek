'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { ProjectionConfig, useGameProjection } from '@/hooks/useGameProjection';
import { useGameConfig } from '@/hooks/useGameConfig';

interface BaseGameClientProps {
  useMapData: () => { data: any; status: 'pending' | 'success' | 'error' };
  configKey: string;
  gameKey: string;
  duration: number;
  projectionConfig: ProjectionConfig;
  showOnlyValid?: boolean;
}

export default function BaseGameClient({
  useMapData,
  configKey,
  gameKey,
  duration,
  projectionConfig,
  showOnlyValid,
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

  if (mapStatus === 'pending' || configStatus === 'pending') {
    return <div>Loading...</div>;
  }

  return (
    <QuizLayout
      title={t(`gameData.${gameKey}.title`)}
      description={t(`gameData.${gameKey}.description`)}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={duration}
      showOnlyValid={showOnlyValid}
    />
  );
}
