import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Flame,
  Radio,
  Activity,
  AlertCircle,
  Tv2
} from 'lucide-react';
import { ChannelsConfig, ViewerStats, ThemeMode } from '../types/widget';
import { StreamHealthSummary } from '../types/streamHealth';
import type { ObsConnectionStatus, ObsStreamStats } from '../types/obs';
import { fetchAllViewerStats } from '../utils/viewers';

interface ViewerBarProps {
  channels: ChannelsConfig;
  themeMode?: ThemeMode;
  healthSummary?: StreamHealthSummary | null;
  streamAlerts?: string[];
  obsStatus?: ObsConnectionStatus;
  obsStats?: ObsStreamStats;
  onOpenHealthModal?: () => void;
  onOpenObsModal?: () => void;
  onStatsUpdate?: (stats: ViewerStats) => void;
}

const REFRESH_INTERVAL_SECONDS = 15;

const SIZE_CONFIGS = {
  containerPadding: 'py-2',
  totalChipPadding: 'px-3 py-1',
  totalFlameIcon: 'w-3.5 h-3.5',
  totalLabelText: 'text-[11px]',
  totalNumberText: 'text-sm font-bold',
  chipPadding: 'px-2.5 py-1',
  chipDot: 'w-2 h-2',
  chipLabelText: 'text-[11px]',
  chipUserText: 'text-[11px]',
  chipNumberText: 'text-xs font-bold',
  chipRadioIcon: 'w-3 h-3',
};

export const ViewerBar: React.FC<ViewerBarProps> = ({
  channels,
  themeMode,
  healthSummary,
  streamAlerts = [],
  obsStatus,
  obsStats,
  onOpenHealthModal,
  onOpenObsModal,
  onStatsUpdate,
}) => {
  const [stats, setStats] = useState<ViewerStats>({
    twitch: { channel: channels.twitch, viewers: 0, isLive: false, loading: true },
    kick: { channel: channels.kick, viewers: 0, isLive: false, loading: true },
    youtube: { channel: channels.youtube, viewers: 0, isLive: false, loading: true },
    facebook: { channel: channels.facebook || '', viewers: 0, isLive: false, loading: true },
    tiktok: { channel: channels.tiktok || '', viewers: 0, isLive: false, loading: true },
    total: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newStats = await fetchAllViewerStats(channelsRef.current);
      setStats(newStats);
      if (onStatsUpdate) {
        onStatsUpdate(newStats);
      }
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Error al actualizar viewers:', e);
    } finally {
      setIsRefreshing(false);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    }
  }, [onStatsUpdate]);

  // Run on mount or when channels change
  useEffect(() => {
    refreshStats();
  }, [channels, refreshStats]);

  // Real-time 1-second countdown ticker for automatic polling
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshStats();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshStats]);

  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';
  const currentConfig = SIZE_CONFIGS;

  return (
    <div className={`border-b px-4 ${currentConfig.containerPadding} text-xs transition-all ${
      isLight 
        ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-sm' 
        : isDark 
        ? 'bg-black/95 border-zinc-800/90 text-zinc-100' 
        : 'bg-zinc-950/60 border-zinc-800/90 text-zinc-100'
    }`}>
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Viewers Count Chips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Total Viewers Flame Chip */}
          <div className={`flex items-center gap-1.5 ${currentConfig.totalChipPadding} rounded-lg bg-gradient-to-r from-purple-500/15 via-rose-500/15 to-amber-500/15 border border-purple-500/30 text-white font-medium shadow-sm transition-all`}>
            <Flame className={`${currentConfig.totalFlameIcon} text-amber-400 shrink-0`} />
            <span className={`${currentConfig.totalLabelText} font-normal ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Total Viewers:</span>
            <span className={`tracking-tight ${currentConfig.totalNumberText} ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
              {stats.total.toLocaleString()}
            </span>
          </div>

          <div className={`h-4 w-[1px] hidden sm:block ${isLight ? 'bg-zinc-300' : 'bg-zinc-800'}`} />

          {/* Twitch Chip */}
          <div className={`flex items-center gap-1.5 ${currentConfig.chipPadding} rounded-lg border text-xs transition-all ${
            isLight ? 'bg-purple-50 border-purple-200 text-zinc-800' : 'bg-zinc-900 border-purple-500/30 text-zinc-200'
          }`}>
            <span className={`${currentConfig.chipDot} rounded-full bg-purple-500 shrink-0`} />
            <span className={`font-semibold ${currentConfig.chipLabelText} ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Twitch</span>
            {channels.twitch ? (
              <span className={`flex items-center gap-1 ${currentConfig.chipUserText}`}>
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>({channels.twitch})</span>
                {stats.twitch.isLive ? (
                  <span className={`flex items-center gap-1 ${currentConfig.chipNumberText} ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    <Radio className={`${currentConfig.chipRadioIcon} animate-pulse shrink-0`} />
                    {stats.twitch.viewers.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500">Offline</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[10px]">No configurado</span>
            )}
          </div>

          {/* Kick Chip */}
          <div 
            className={`flex items-center gap-1.5 ${currentConfig.chipPadding} rounded-lg border text-xs transition-all ${
              isLight ? 'bg-green-50 border-green-200 text-zinc-800' : 'bg-zinc-900 border-green-500/30 text-zinc-200'
            }`}
            title={
              stats.kick.rawViewers !== undefined && stats.kick.rawViewers !== stats.kick.viewers
                ? `Kick: ${stats.kick.viewers} espectadores reales (Kick reporta ${stats.kick.rawViewers} en bruto incluyendo vista propia)`
                : stats.kick.isLive
                ? `Kick: ${stats.kick.viewers} espectadores`
                : 'Kick: Offline'
            }
          >
            <span className={`${currentConfig.chipDot} rounded-full bg-green-500 shrink-0`} />
            <span className={`font-semibold ${currentConfig.chipLabelText} ${isLight ? 'text-green-700' : 'text-green-300'}`}>Kick</span>
            {channels.kick ? (
              <span className={`flex items-center gap-1 ${currentConfig.chipUserText}`}>
                <span className="text-zinc-500">({channels.kick})</span>
                {stats.kick.isLive ? (
                  <span className={`flex items-center gap-1 ${currentConfig.chipNumberText} ${isLight ? 'text-green-600' : 'text-green-400'}`}>
                    <Radio className={`${currentConfig.chipRadioIcon} animate-pulse shrink-0`} />
                    {stats.kick.viewers.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500">Offline</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[10px]">No configurado</span>
            )}
          </div>

          {/* YouTube Chip */}
          <div className={`flex items-center gap-1.5 ${currentConfig.chipPadding} rounded-lg border text-xs transition-all ${
            isLight ? 'bg-red-50 border-red-200 text-zinc-800' : 'bg-zinc-900 border-red-500/30 text-zinc-200'
          }`}>
            <span className={`${currentConfig.chipDot} rounded-full bg-red-500 shrink-0`} />
            <span className={`font-semibold ${currentConfig.chipLabelText} ${isLight ? 'text-red-700' : 'text-red-300'}`}>YouTube</span>
            {channels.youtube || channels.youtubeHandle ? (
              <span className={`flex items-center gap-1 ${currentConfig.chipUserText}`}>
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>
                  ({channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : channels.youtube})
                </span>
                {stats.youtube.isLive ? (
                  <span className={`flex items-center gap-1 ${currentConfig.chipNumberText} ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                    <Radio className={`${currentConfig.chipRadioIcon} animate-pulse shrink-0`} />
                    {stats.youtube.viewers.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500">Offline</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[10px]">No configurado</span>
            )}
          </div>

          {/* Facebook Chip */}
          <div className={`flex items-center gap-1.5 ${currentConfig.chipPadding} rounded-lg border text-xs transition-all ${
            isLight ? 'bg-blue-50 border-blue-200 text-zinc-800' : 'bg-zinc-900 border-blue-500/30 text-zinc-200'
          }`}>
            <span className={`${currentConfig.chipDot} rounded-full bg-blue-600 shrink-0`} />
            <span className={`font-semibold ${currentConfig.chipLabelText} ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>Facebook</span>
            {channels.facebook ? (
              <span className={`flex items-center gap-1 ${currentConfig.chipUserText}`}>
                <span className="text-zinc-500">
                  ({channels.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/\/.*$/, '')})
                </span>
                {stats.facebook?.isLive ? (
                  <span className={`flex items-center gap-1 ${currentConfig.chipNumberText} ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    <Radio className={`${currentConfig.chipRadioIcon} animate-pulse shrink-0`} />
                    {stats.facebook.viewers.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500">Offline</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[10px]">No configurado</span>
            )}
          </div>

          {/* TikTok Chip */}
          <div 
            className={`flex items-center gap-1.5 ${currentConfig.chipPadding} rounded-lg border text-xs transition-all ${
              isLight ? 'bg-pink-50 border-pink-200 text-zinc-800' : 'bg-zinc-900 border-pink-500/30 text-zinc-200'
            }`}
            title={
              stats.tiktok?.isLive
                ? `TikTok: ${stats.tiktok.viewers} espectadores en vivo`
                : 'TikTok: Offline'
            }
          >
            <span className={`${currentConfig.chipDot} rounded-full bg-pink-500 shrink-0`} />
            <span className={`font-semibold ${currentConfig.chipLabelText} ${isLight ? 'text-pink-600' : 'text-pink-400'}`}>TikTok</span>
            {channels.tiktok ? (
              <span className={`flex items-center gap-1 ${currentConfig.chipUserText}`}>
                <span className="text-zinc-500">
                  (@{channels.tiktok.replace(/^@/, '')})
                </span>
                {stats.tiktok?.isLive ? (
                  <span className={`flex items-center gap-1 ${currentConfig.chipNumberText} ${isLight ? 'text-pink-600' : 'text-pink-400'}`}>
                    <Radio className={`${currentConfig.chipRadioIcon} animate-pulse shrink-0`} />
                    {stats.tiktok.viewers.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500">Offline</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[10px]">No configurado</span>
            )}
          </div>

          {/* Stream Connection Health Chip */}
          <button
            type="button"
            onClick={onOpenHealthModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all hover:scale-[1.02] cursor-pointer ${
              healthSummary?.overallRating === 'excellent'
                ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : healthSummary?.overallRating === 'good'
                ? isLight ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                : healthSummary?.overallRating === 'fair'
                ? isLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : isLight ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            title="Diagnóstico de red y salud del stream (haz clic para ver el test completo de todos los servicios)"
          >
            <span className={`w-2 h-2 rounded-full ${
              (healthSummary?.averageLatencyMs || 0) < 100 ? 'bg-emerald-400' :
              (healthSummary?.averageLatencyMs || 0) < 250 ? 'bg-amber-400' : 'bg-rose-400'
            } animate-pulse shrink-0`} />
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold text-[11px]">
              {healthSummary ? `Ping: ${healthSummary.averageLatencyMs} ms` : 'Ping'}
            </span>
          </button>

          {/* OBS Studio Live Status Chip */}
          <button
            type="button"
            onClick={onOpenObsModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all hover:scale-[1.02] cursor-pointer ${
              obsStatus === 'connected'
                ? obsStats?.outputActive
                  ? isLight ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                  : isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : obsStatus === 'connecting'
                ? isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900' : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Estado del endpoint OBS Studio WebSocket (haz clic para conectar y ver métricas)"
          >
            <Tv2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span className="font-bold text-[11px]">OBS:</span>
            {obsStatus === 'connected' ? (
              obsStats?.outputActive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EN VIVO
                  <span className="text-[10px] font-mono text-zinc-400 font-normal hidden md:inline">
                    ({obsStats.outputTimecode || '00:00:00'})
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400 font-medium">Listo</span>
              )
            ) : obsStatus === 'connecting' ? (
              <span className="text-[11px] text-amber-400 font-medium">Conectando...</span>
            ) : (
              <span className="text-[10px] text-zinc-500">Desconectado</span>
            )}
          </button>

          {/* Stream Drop Warning Indicator (if any alerts) */}
          {streamAlerts.length > 0 && (
            <button
              type="button"
              onClick={onOpenHealthModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold animate-pulse cursor-pointer"
              title={streamAlerts.join(' - ')}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{streamAlerts.length} Caída{streamAlerts.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        {/* Right: Real-Time Automatic Telemetry Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium shadow-sm transition-colors ${
            isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{isRefreshing ? 'Sincronizando...' : `Auto-actualización (${countdown}s)`}</span>
            {lastUpdatedTime && (
              <span className={`border-l pl-1.5 font-mono text-[10px] ${isLight ? 'text-zinc-500 border-zinc-300' : 'text-zinc-500 border-zinc-800'}`}>
                {lastUpdatedTime}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
