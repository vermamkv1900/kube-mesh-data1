import React from 'react';
import { ClusterRealisticView } from './ClusterRealisticView';

interface ClusterHeatMapProps {
  onOpenAnomalyReport?: (findingId?: string) => void;
  initialSubTab?: 'architecture' | 'nodes' | 'volumetrics' | 'connections' | 'heatmap';
}

export const ClusterHeatMap: React.FC<ClusterHeatMapProps> = ({
  onOpenAnomalyReport,
  initialSubTab = 'architecture',
}) => {
  return (
    <ClusterRealisticView
      initialSubTab={initialSubTab}
      onOpenAnomalyReport={onOpenAnomalyReport}
    />
  );
};
