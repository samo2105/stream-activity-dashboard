import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCw, 
  Edit2, 
  Check, 
  X, 
  Flame,
  Radio
} from 'lucide-react';
import { ChannelsConfig, ViewerStats } from '../types/widget';
import { fetchAllViewerStats } from '../utils/viewers';

interface ViewerBarProps {
  channels: ChannelsConfig;
  onUpdateChannels: (channels: ChannelsConfig) => void;
  onOpenProfileModal?: () => void;
}

const REFRESH_INTERVAL_SECONDS = 15;

export const ViewerBar: React.FC<ViewerBarProps> = ({
  channels,
  onUpdateChannels,
  onOpenProfileModal,
}) => {
  const [stats, setStats] = useState<ViewerStats>({
    twitch: { channel: channels.twitch, viewers: 0, isLive: false, loading: true },
    kick: { channel: channels.kick, viewers: 0, isLive: false, loading: true },
    youtube: { channel: channels.youtube, viewers: 0, isLive: false, loading: true },
    total: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editChannels, setEditChannels] = useState<ChannelsConfig>(channels);
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newStats = await fetchAllViewerStats(channelsRef.current);
      setStats(newStats);
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Error al actualizar viewers:', e);
    } finally {
      setIsRefreshing(false);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    }
  }, []);

  // Run on mount or when channels change
  useEffect(() => {
    refreshStats();
  }, [channels, refreshStats]);

  // Real-time 1-second countdown ticker
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

  useEffect(() => {
    setEditChannels(channels);
  }, [channels]);

  const handleSaveChannels = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateChannels(editChannels);
    setIsEditing(false);
  };

  const handleManualRefresh = () => {
    setCountdown(REFRESH_INTERVAL_SECONDS);
    refreshStats();
  };

  return (
    <div className="border-b border-zinc-800/90 bg-zinc-950/60 px-4 py-2 text-xs">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Viewers Count Chips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Total Viewers Flame Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500/15 via-rose-500/15 to-amber-500/15 border border-purple-500/30 text-white font-medium shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-zinc-400 font-normal">Total Viewers:</span>
            <span className="font-bold text-sm tracking-tight text-amber-300">
              {stats.total.toLocaleString()}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          {/* Twitch Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-purple-500/30 text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-semibold text-[11px] text-purple-300">Twitch</span>
            {channels.twitch ? (
              <span className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-500">({channels.twitch})</span>
                {stats.twitch.isLive ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-green-500/30 text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-semibold text-[11px] text-green-300">Kick</span>
            {channels.kick ? (
              <span className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-500">({channels.kick})</span>
                {stats.kick.isLive ? (
                  <span className="font-bold text-green-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-red-500/30 text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-semibold text-[11px] text-red-300">YouTube</span>
            {channels.youtube || channels.youtubeHandle ? (
              <span className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-500">
                  ({channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : channels.youtube})
                </span>
                {stats.youtube.isLive ? (
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
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

          {/* Real-Time Live Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
            <span>
              {isRefreshing ? 'Actualizando...' : `Actualizando en ${countdown}s`}
            </span>
            {lastUpdatedTime && (
              <span className="text-zinc-600 border-l border-zinc-800 pl-1.5">
                {lastUpdatedTime}
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Edit Form */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <form onSubmit={handleSaveChannels} className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Canal Twitch"
                value={editChannels.twitch}
                onChange={(e) => setEditChannels({ ...editChannels, twitch: e.target.value })}
                className="w-24 sm:w-28 px-2 py-0.5 bg-zinc-900 border border-purple-500/40 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Canal Kick"
                value={editChannels.kick}
                onChange={(e) => setEditChannels({ ...editChannels, kick: e.target.value })}
                className="w-24 sm:w-28 px-2 py-0.5 bg-zinc-900 border border-green-500/40 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="ID Video YT"
                value={editChannels.youtube}
                onChange={(e) => setEditChannels({ ...editChannels, youtube: e.target.value })}
                className="w-24 sm:w-28 px-2 py-0.5 bg-zinc-900 border border-red-500/40 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                title="Guardar canales"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenProfileModal) {
                    onOpenProfileModal();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-[11px]"
                title="Configurar nombres de canales para el conteo de viewers"
              >
                <Edit2 className="w-3 h-3 text-purple-400" />
                <span>Configurar Canales</span>
              </button>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-[11px]"
                title="Actualizar recuento de viewers ahora"
              >
                <RotateCw className={`w-3 h-3 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar ({countdown}s)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
