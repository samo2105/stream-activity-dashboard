export type ObsConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error' 
  | 'auth_failed';

export interface ObsConfig {
  enabled: boolean;
  host: string; // e.g. "localhost" or "127.0.0.1" or local IP
  port: number; // default: 4455
  password?: string;
  autoConnect: boolean;
}

export interface ObsStreamStats {
  outputActive: boolean;
  outputReconnecting: boolean;
  outputTimecode: string;
  outputDuration: number; // in milliseconds
  outputBytes: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
  outputCongestion: number; // 0.0 = clear, 1.0 = saturated
  fps: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  renderSkippedFrames: number;
  renderTotalFrames: number;
  isRecording: boolean;
  recordTimecode?: string;
  recordDuration?: number;
  lastUpdated?: number;
}

export const DEFAULT_OBS_CONFIG: ObsConfig = {
  enabled: false,
  host: 'localhost',
  port: 4455,
  password: '',
  autoConnect: false,
};

export const INITIAL_OBS_STATS: ObsStreamStats = {
  outputActive: false,
  outputReconnecting: false,
  outputTimecode: '00:00:00',
  outputDuration: 0,
  outputBytes: 0,
  outputSkippedFrames: 0,
  outputTotalFrames: 0,
  outputCongestion: 0,
  fps: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  renderSkippedFrames: 0,
  renderTotalFrames: 0,
  isRecording: false,
  recordTimecode: '00:00:00',
  recordDuration: 0,
};
