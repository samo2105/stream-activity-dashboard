export type WidgetPlatform = 
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
  columnSpan?: 1 | 2; // 1 = regular column, 2 = wide card
  height?: number; // optional custom height in px
  createdAt: number;
}

export type GridColumns = 1 | 2 | 3 | 4;

export interface DashboardConfig {
  columns: GridColumns;
  autoRefreshInterval: number; // in seconds (0 = off)
  widgets: WidgetItem[];
}
