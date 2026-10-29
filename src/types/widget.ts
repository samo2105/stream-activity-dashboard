export type WidgetPlatform = 
  | 'eventlist'
  | 'chatbox'
  | 'streamlabs'
  | 'streamelements'
  | 'twitch'
  | 'kick'
  | 'youtube'
  | 'facebook'
  | 'botrix'
  | 'tiktok'
  | 'custom';

export type ThemeMode = 'normal' | 'dark' | 'light';

export type CounterSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetItem {
  id: string;
  title: string;
  platform: WidgetPlatform;
  url: string;
  columnSpan?: 1 | 2; // 1 = normal, 2 = wide card
  height?: number;
  themeMode?: ThemeMode; // 'normal' (default), 'dark' (high contrast OLED), 'light' (clean white)
  fontScale?: number; // scale factor for frame content: 0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0
  highContrast?: boolean; // legacy compatibility fallback
  createdAt: number;
}

export type GridColumns = 1 | 2 | 3 | 4;

export interface ChannelsConfig {
  twitch: string;
  kick: string;
  youtube: string;
  youtubeHandle?: string;
  youtubeApiKey?: string;
  facebook?: string;
  facebookPageId?: string;
  facebookAccessToken?: string;
  streamlabsToken?: string;
  deductKickSelfView?: boolean;
}

export interface PlatformViewerData {
  channel: string;
  viewers: number;
  isLive: boolean;
  loading: boolean;
  error?: string;
  videoId?: string;
  rawViewers?: number;
}

export interface ViewerStats {
  twitch: PlatformViewerData;
  kick: PlatformViewerData;
  youtube: PlatformViewerData;
  facebook: PlatformViewerData;
  total: number;
  lastUpdated?: number;
}

import type { ObsConfig } from './obs';

export interface DashboardConfig {
  columns: GridColumns;
  autoRefreshInterval: number; // in seconds (0 = off)
  themeMode?: ThemeMode; // 'normal' | 'dark' | 'light'
  counterSize?: CounterSize; // 'sm' | 'md' | 'lg' | 'xl'
  globalFontScale?: number; // scale factor for all frames: 0.75, 0.85, 1.0, 1.15, 1.3, 1.5, etc.
  obs?: ObsConfig;
  channels: ChannelsConfig;
  widgets: WidgetItem[];
}
