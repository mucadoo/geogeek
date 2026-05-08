'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { ProjectionConfig, useGameProjection } from '@/hooks/useGameProjection';

interface BaseGameClientProps {
  useMapData: () => { data: any; status: 'pending' | 'success' | 'error' };
  regionNames: string[];
  gameKey: string;
  duration: number;
  projectionConfig: ProjectionConfig;
  showOnlyValid?: boolean;
}

export default function BaseGameClient({
  useMapData,
  regionNames,
  gameKey,
  duration,
  projectionConfig,
  showOnlyValid,
}: BaseGameClientProps) {
  const { data: mapData, status: mapStatus } = useMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = useGameProjection(mapData, projectionConfig);

  const localizedValidNames = useMemo(() => {
    const names = [...regionNames];
    regionNames.forEach((name) => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch {
        /* ignore */
      }
    });
    return names;
  }, [tRegions, regionNames]);

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
