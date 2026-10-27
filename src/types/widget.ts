export type WidgetPlatform = 
  | 'eventlist'
  | 'chatbox'
  | 'streamlabs'
  | 'streamelements'
  | 'twitch'
  | 'kick'
  | 'youtube'
  | 'botrix'
  | 'tiktok'
  | 'custom';

export interface WidgetItem {
  id: string;
  title: string;
  platform: WidgetPlatform;
  url: string;
  columnSpan?: 1 | 2; // 1 = normal, 2 = wide card
  height?: number;
  createdAt: number;
}

export type GridColumns = 1 | 2 | 3 | 4;

export interface ChannelsConfig {
  twitch: string;
  kick: string;
  youtube: string;
}

export interface PlatformViewerData {
  channel: string;
  viewers: number;
  isLive: boolean;
  loading: boolean;
  error?: string;
}

export interface ViewerStats {
  twitch: PlatformViewerData;
  kick: PlatformViewerData;
  youtube: PlatformViewerData;
  total: number;
  lastUpdated?: number;
}

export interface DashboardConfig {
  columns: GridColumns;
  autoRefreshInterval: number; // in seconds (0 = off)
  channels: ChannelsConfig;
  widgets: WidgetItem[];
}
