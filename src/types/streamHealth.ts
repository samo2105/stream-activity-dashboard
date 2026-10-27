export type HealthRating = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface ServiceEndpoint {
  id: string;
  name: string;
  category: 'cdn' | 'youtube' | 'twitch' | 'kick' | 'streamlabs';
  url: string;
  description: string;
}

export interface ServiceTestResult {
  id: string;
  name: string;
  category: 'cdn' | 'youtube' | 'twitch' | 'kick' | 'streamlabs';
  targetUrl: string;
  latencyMs: number;
  status: HealthRating;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface StreamHealthSummary {
  overallRating: HealthRating;
  averageLatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  lastChecked: number;
  services: ServiceTestResult[];
  recommendation: string;
  streamAlerts?: string[];
}
