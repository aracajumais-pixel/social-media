// src/metrics/types.ts
import { ClientProject, UserRole, MetricOverview, ChannelPerformance } from '../types';

export interface MetricsDashboardProps {
  client: ClientProject;
  metrics: MetricOverview;
  channels: ChannelPerformance[];
  currentUserRole: UserRole;
  onChangeMetricsAccess?: (clientId: string, access: ClientProject['metricsAccess']) => void;
}

// Tudo que as abas podem precisar: dados vindos por prop + valores calculados no index.tsx.
export interface MetricsTabSharedProps extends MetricsDashboardProps {
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  timeRange: '7d' | '30d' | '90d' | 'ano';
  setTimeRange: (v: '7d' | '30d' | '90d' | 'ano') => void;
  simulatedBudget: number;
  setSimulatedBudget: (v: number) => void;
  comp: any;
  monthlyReachData: any[];
  competitorBarData: any[];
  formatData: any[];
  projectedReach: number;
  projectedClicks: number;
  projectedLeads: number;
  projectedRevenue: number;
}
