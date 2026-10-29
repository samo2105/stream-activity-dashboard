import React, { useState } from 'react';
import { 
  Tv2, 
  VolumeX, 
  Volume2, 
  RotateCw, 
  LayoutGrid, 
  Maximize2, 
  Play, 
  Square, 
  Disc,
  WifiOff
} from 'lucide-react';
import { ChannelsConfig, ThemeMode, ViewerStats, PreviewLayoutMode } from '../types/widget';
import type { ObsConnectionStatus, ObsStreamStats } from '../types/obs';
import { PlatformPreviewCard, PlatformLogo, PreviewPlatformType } from './PlatformPreviewCard';
import { calculateObsDropRate, formatObsBytes } from '../utils/obsWebSocket';

interface LivePreviewsPageProps {
  channels: ChannelsConfig;
  viewerStats?: ViewerStats | null;
  themeMode?: ThemeMode;
  obsStatus?: ObsConnectionStatus;
  obsStats?: ObsStreamStats;
  onOpenObsModal?: () => void;
  onOpenProfileModal?: () => void;
  onToggleObsStream?: () => void;
  onToggleObsRecord?: () => void;
}

export const LivePreviewsPage: React.FC<LivePreviewsPageProps> = ({
  channels,
  viewerStats,
  themeMode = 'normal',
  obsStatus = 'disconnected',
  obsStats,
  onOpenObsModal,
  onOpenProfileModal,
  onToggleObsStream,
  onToggleObsRecord,
}) => {
  const [layoutMode, setLayoutMode] = useState<PreviewLayoutMode>('grid');
  const [theaterFocus, setTheaterFocus] = useState<PreviewPlatformType>('twitch');
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(true);
  const [globalReloadKey, setGlobalReloadKey] = useState<number>(0);

  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';

  // Count active live platforms
  const liveCount = (
    (viewerStats?.twitch?.isLive ? 1 : 0) +
    (viewerStats?.kick?.isLive ? 1 : 0) +
    (viewerStats?.youtube?.isLive ? 1 : 0) +
    (viewerStats?.facebook?.isLive ? 1 : 0) +
    (viewerStats?.tiktok?.isLive ? 1 : 0)
  );

  const platforms: {
    key: PreviewPlatformType;
    channel: string;
    channelHandle?: string;
    viewerData?: any;
  }[] = [
    {
      key: 'twitch',
      channel: channels.twitch,
      viewerData: viewerStats?.twitch,
    },
    {
      key: 'kick',
      channel: channels.kick,
      viewerData: viewerStats?.kick,
    },
    {
      key: 'youtube',
      channel: channels.youtube,
      channelHandle: channels.youtubeHandle,
      viewerData: viewerStats?.youtube,
    },
    {
      key: 'tiktok',
      channel: channels.tiktok || '',
      viewerData: viewerStats?.tiktok,
    },
    {
      key: 'facebook',
      channel: channels.facebook || '',
      viewerData: viewerStats?.facebook,
    },
  ];

  return (
    <div className={`min-h-[calc(100vh-140px)] p-4 sm:p-6 transition-colors ${
      isLight ? 'bg-zinc-100/70 text-zinc-900' : isDark ? 'bg-black text-zinc-100' : 'bg-zinc-950 text-zinc-100'
    }`}>
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Studio Toolbar / Header - Only Chips & Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
          {/* Left: Chip with live platforms count */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              liveCount > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : isLight
                ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${liveCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{liveCount > 0 ? `${liveCount} de 5 en directo` : '5 plataformas'}</span>
            </span>
          </div>

          {/* Right: Controls & Buttons */}
          <div className="flex items-center gap-2">
            {/* Layout Mode: Grid vs Theater */}
            <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                }`}
                title="Ver todas las plataformas en cuadrícula de mosaico"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mosaico</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('theater')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
                  layoutMode === 'theater'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                }`}
                title="Modo Teatro: stream principal grande con miniaturas al pie"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Teatro</span>
              </button>
            </div>

            {/* Global Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsGlobalMuted(!isGlobalMuted)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isGlobalMuted
                  ? isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-sm'
              }`}
              title={isGlobalMuted ? 'Todos los streams están silenciados para evitar solapamiento de audio' : 'Silenciar todos los reproductores'}
            >
              {isGlobalMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
              <span>{isGlobalMuted ? 'Silenciado' : 'Audio On'}</span>
            </button>

            {/* Reload All */}
            <button
              type="button"
              onClick={() => setGlobalReloadKey((prev) => prev + 1)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title="Recargar todos los reproductores de stream"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Studio Content: Grid Mode vs Theater Mode */}
        {layoutMode === 'theater' ? (
          /* THEATER / FOCUS MODE */
          <div className="space-y-6 animate-fadeIn">
            {/* Main Stage Focused Stream */}
            <div className="w-full">
              {(() => {
                const target = platforms.find((p) => p.key === theaterFocus) || platforms[0];
                return (
                  <PlatformPreviewCard
                    key={`${target.key}-${globalReloadKey}`}
                    platform={target.key}
                    channel={target.channel}
                    channelHandle={target.channelHandle}
                    viewerData={target.viewerData}
                    themeMode={themeMode}
                    isGlobalMuted={isGlobalMuted}
                    isTheaterFocus={true}
                    onSetTheaterFocus={() => {}}
                    onOpenProfileModal={onOpenProfileModal}
                  />
                );
              })()}
            </div>

            {/* Bottom Row / Miniatures selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Seleccionar stream enfocado:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {platforms.map((p) => {
                  const isSelected = p.key === theaterFocus;
                  const isItemLive = Boolean(p.viewerData?.isLive);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setTheaterFocus(p.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md'
                          : isLight
                          ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PlatformLogo platform={p.key} className="w-3.5 h-3.5" />
                          <span className="font-bold text-xs capitalize truncate">{p.key}</span>
                        </div>
                        {isItemLive ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        ) : (
                          <span title="Offline" className="shrink-0">
                            <WifiOff className="w-3 h-3 text-zinc-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {p.channel ? `@${p.channel.replace(/^@/, '')}` : 'Sin configurar'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* GRID / MOSAIC MODE */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fadeIn">
            {platforms.map((p) => (
              <PlatformPreviewCard
                key={`${p.key}-${globalReloadKey}`}
                platform={p.key}
                channel={p.channel}
                channelHandle={p.channelHandle}
                viewerData={p.viewerData}
                themeMode={themeMode}
                isGlobalMuted={isGlobalMuted}
                isTheaterFocus={false}
                onSetTheaterFocus={() => {
                  setTheaterFocus(p.key);
                  setLayoutMode('theater');
                }}
                onOpenProfileModal={onOpenProfileModal}
              />
            ))}

            {/* OBS Studio Live Hardware / Output Monitor Card */}
            <div className={`flex flex-col rounded-2xl border transition-all shadow-lg overflow-hidden ${
              isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
            }`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/70 border-zinc-800'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <Tv2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">OBS Studio Monitor</h3>
                    <span className="text-[10px] text-zinc-400 block">WebSocket v5 Telemetry</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  obsStatus === 'connected'
                    ? obsStats?.outputActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {obsStatus === 'connected' ? (obsStats?.outputActive ? 'EMITIENDO EN DIRECTO' : 'CONECTADO / LISTO') : 'DESCONECTADO'}
                </span>
              </div>

              <div className="relative w-full aspect-video p-4 flex flex-col justify-between overflow-y-auto">
                {obsStatus === 'connected' ? (
                  <div className="space-y-4">
                    {/* Live Output Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 block">Tiempo Emisión</span>
                        <span className="text-xs font-bold font-mono text-purple-400">
                          {obsStats?.outputTimecode || '00:00:00'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 block">FPS</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {Math.round(obsStats?.fps || 60)} FPS
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 block">Datos Emitidos</span>
                        <span className="text-xs font-bold font-mono text-amber-400">
                          {formatObsBytes(obsStats?.outputBytes || 0)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 block">Cuadros Perdidos</span>
                        {(() => {
                          const dropRate = obsStats ? calculateObsDropRate(obsStats.outputSkippedFrames, obsStats.outputTotalFrames) : 0;
                          return (
                            <span className={`text-xs font-bold font-mono ${
                              dropRate > 2 ? 'text-rose-400' : 'text-zinc-300'
                            }`}>
                              {obsStats?.outputSkippedFrames || 0} ({dropRate.toFixed(1)}%)
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* OBS Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {onToggleObsStream && (
                        <button
                          type="button"
                          onClick={onToggleObsStream}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                            obsStats?.outputActive
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {obsStats?.outputActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{obsStats?.outputActive ? 'Detener Emisión OBS' : 'Iniciar Emisión OBS'}</span>
                        </button>
                      )}

                      {onToggleObsRecord && (
                        <button
                          type="button"
                          onClick={onToggleObsRecord}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                            obsStats?.isRecording
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                          }`}
                        >
                          <Disc className="w-3.5 h-3.5" />
                          <span>{obsStats?.isRecording ? 'Detener Grabación' : 'Grabar en OBS'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                      Conecta OBS Studio mediante WebSocket v5 para controlar la emisión, grabación y monitorizar cuadros perdidos en tiempo real.
                    </p>
                    {onOpenObsModal && (
                      <button
                        type="button"
                        onClick={onOpenObsModal}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all"
                      >
                        Abrir Panel OBS Studio
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Control de Emisión Local</span>
                  {onOpenObsModal && (
                    <button
                      type="button"
                      onClick={onOpenObsModal}
                      className="text-purple-400 hover:underline"
                    >
                      Ajustes de Conexión
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
