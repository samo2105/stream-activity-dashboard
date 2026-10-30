import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Play, 
  WifiOff, 
  ExternalLink, 
  Tv2, 
  Copy, 
  Check, 
  Sliders
} from 'lucide-react';
import { ThemeMode, PlatformViewerData } from '../types/widget';
import { 
  generateTwitchPlayerEmbedUrl, 
  generateYouTubePlayerEmbedUrl, 
  generateKickPlayerEmbedUrl, 
  generateFacebookPlayerEmbedUrl, 
  generateTikTokPlayerEmbedUrl 
} from '../utils/urlHelper';
import { PlatformLogo, PLATFORM_META, PreviewPlatformType } from './PlatformPreviewCard';

interface PlatformListCardProps {
  platform: PreviewPlatformType;
  channel: string;
  channelHandle?: string;
  viewerData?: PlatformViewerData;
  themeMode?: ThemeMode;
  isGlobalMuted: boolean;
  onOpenProfileModal?: () => void;
  draftTitle: string;
  draftCategory: string;
  draftTags: string;
  onUpdateDraft: (field: 'title' | 'category' | 'tags', value: string) => void;
  onSyncToAll: () => void;
  allTitlesMatch: boolean;
}

export const PlatformListCard: React.FC<PlatformListCardProps> = ({
  platform,
  channel,
  channelHandle,
  viewerData,
  themeMode = 'normal',
  isGlobalMuted,
  onOpenProfileModal,
  draftTitle,
  draftCategory,
  draftTags,
  onUpdateDraft,
  onSyncToAll,
  allTitlesMatch,
}) => {
  const [isLocalMuted, setIsLocalMuted] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [forcePreview, setForcePreview] = useState<boolean>(false);

  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';
  const meta = PLATFORM_META[platform];

  const isEffectiveMuted = isGlobalMuted || isLocalMuted;

  // Resolve player embed URL
  const getEmbedUrl = (): string => {
    if (!channel) return '';
    switch (platform) {
      case 'twitch':
        return generateTwitchPlayerEmbedUrl(channel, isEffectiveMuted);
      case 'youtube':
        return generateYouTubePlayerEmbedUrl(viewerData?.videoId || channel, isEffectiveMuted);
      case 'kick':
        return generateKickPlayerEmbedUrl(channel, isEffectiveMuted);
      case 'facebook':
        return generateFacebookPlayerEmbedUrl(channel, isEffectiveMuted);
      case 'tiktok':
        return generateTikTokPlayerEmbedUrl(channel);
      default:
        return '';
    }
  };

  const embedUrl = getEmbedUrl();
  const isLive = Boolean(viewerData?.isLive);
  const viewersCount = viewerData?.viewers || 0;

  // Display handle/username
  const displayChannel = channelHandle
    ? `@${channelHandle.replace(/^@/, '')}`
    : channel ? `@${channel.replace(/^@/, '')}` : 'Sin configurar';

  return (
    <div className={`rounded-2xl border transition-all shadow-lg overflow-hidden ${
      isLight 
        ? 'bg-white border-zinc-200 text-zinc-900' 
        : isDark 
        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
        : 'bg-zinc-900/90 border-zinc-800/90 text-zinc-100'
    } ${meta.borderActive}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap ${
        isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/70 border-zinc-800'
      }`}>
        {/* Left: Platform Identity & Live Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <PlatformLogo platform={platform} className="w-4 h-4 shrink-0" />
            <span className="font-bold text-xs tracking-tight">{meta.name}</span>
          </div>

          <span className={`text-xs truncate max-w-[150px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {displayChannel}
          </span>

          {channel ? (
            isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>EN VIVO</span>
                <span className="font-mono font-semibold ml-0.5">({viewersCount.toLocaleString()})</span>
              </span>
            ) : (
              <span 
                className="inline-flex items-center p-1 rounded-full text-zinc-500 bg-zinc-800/60 border border-zinc-700/60 shrink-0"
                title="Offline"
              >
                <WifiOff className="w-3 h-3 text-zinc-400" />
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              No configurado
            </span>
          )}
        </div>

        {/* Right: Quick Action Icons & Stream Manager Button */}
        <div className="flex items-center gap-2">
          {channel && (
            <>
              {/* Mute/Unmute */}
              <button
                type="button"
                onClick={() => setIsLocalMuted(!isLocalMuted)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isEffectiveMuted
                    ? isLight ? 'text-zinc-500 hover:text-zinc-800 bg-zinc-100 border-zinc-200' : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
                    : 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                }`}
                title={isEffectiveMuted ? 'Activar sonido de este stream' : 'Silenciar este stream'}
              >
                {isEffectiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Reload Player */}
              <button
                type="button"
                onClick={() => setReloadKey((prev) => prev + 1)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight ? 'text-zinc-500 hover:text-zinc-800 bg-zinc-100 border-zinc-200' : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
                }`}
                title="Recargar reproductor"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* STREAM MANAGER BUTTON */}
          <a
            href={meta.creatorDashboardUrl(channel)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all shrink-0"
            title={`Abrir Stream Manager oficial de ${meta.name} en una nueva pestaña`}
          >
            <span>Ir a Stream Manager</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Body: Split View (Left = Player, Right = Config & Alignment Data) */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Player (Aspect-Video 16:9) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800/80 shadow-inner flex items-center justify-center">
            {!channel ? (
              <div className="p-4 text-center flex flex-col items-center justify-center gap-2 bg-zinc-950/90 w-full h-full">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Tv2 className="w-5 h-5 opacity-75" />
                </div>
                <div className="max-w-xs">
                  <h4 className="text-xs font-semibold text-zinc-200">Canal no configurado</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Agrega tu usuario de {meta.name} para visualizar el stream.
                  </p>
                </div>
                {onOpenProfileModal && (
                  <button
                    type="button"
                    onClick={onOpenProfileModal}
                    className="mt-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    Configurar Canal
                  </button>
                )}
              </div>
            ) : !isLive && !forcePreview ? (
              <div className="p-4 text-center flex flex-col items-center justify-center gap-2 bg-zinc-950/90 w-full h-full animate-fadeIn">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500" title="Offline">
                  <WifiOff className="w-6 h-6 opacity-70" />
                </div>
                <button
                  type="button"
                  onClick={() => setForcePreview(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium shadow-sm transition-all"
                >
                  <Play className="w-3 h-3 text-purple-400 fill-current" />
                  <span>Cargar reproductor</span>
                </button>
              </div>
            ) : (
              <iframe
                key={`${embedUrl}-${reloadKey}-${isEffectiveMuted}`}
                src={embedUrl}
                title={`${meta.name} List Live Player`}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* Right: Config & Stream Data to Contrast & Align */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-3.5">
          <div className="space-y-3">
            {/* Stream Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-purple-400" />
                  <span>Título de la Emisión en {meta.name}:</span>
                </label>
                <div className="flex items-center gap-2">
                  {allTitlesMatch && draftTitle && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>Alineado</span>
                    </span>
                  )}
                  {draftTitle && (
                    <button
                      type="button"
                      onClick={onSyncToAll}
                      className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 hover:underline"
                      title="Copiar este título y categoría a todas las demás plataformas para alinearlas"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copiar a todos</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder={`ej. ¡Directo en vivo en ${meta.name}! | Charlando y Jugando`}
                value={draftTitle}
                onChange={(e) => onUpdateDraft('title', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category / Game & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Categoría / Juego:
                </label>
                <input
                  type="text"
                  placeholder="ej. Just Chatting, Valorant..."
                  value={draftCategory}
                  onChange={(e) => onUpdateDraft('category', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Etiquetas / Tags:
                </label>
                <input
                  type="text"
                  placeholder="ej. Español, Pro, Chill"
                  value={draftTags}
                  onChange={(e) => onUpdateDraft('tags', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Ingest Server Info & Stream Manager Link */}
            <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-zinc-500 block text-[10px]">Servidor Ingest RTMP recomendado:</span>
                <code className="text-purple-300 font-mono text-[10px] break-all block">
                  {meta.defaultIngest}
                </code>
              </div>
              <a
                href={meta.creatorDashboardUrl(channel)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-xs font-semibold hover:underline ml-auto"
              >
                <span>{meta.creatorDashboardName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
