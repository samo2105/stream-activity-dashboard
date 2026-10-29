import React, { useState, useEffect } from 'react';
import { 
  Tv2, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  ExternalLink, 
  Maximize2, 
  Settings2, 
  Sliders, 
  Play, 
  WifiOff, 
  Check, 
  Info,
  Youtube,
  Twitch
} from 'lucide-react';
import { ThemeMode, PlatformViewerData } from '../types/widget';
import { 
  generateTwitchPlayerEmbedUrl, 
  generateYouTubePlayerEmbedUrl, 
  generateKickPlayerEmbedUrl, 
  generateFacebookPlayerEmbedUrl, 
  generateTikTokPlayerEmbedUrl 
} from '../utils/urlHelper';

export type PreviewPlatformType = 'twitch' | 'kick' | 'youtube' | 'tiktok' | 'facebook';

interface PlatformPreviewCardProps {
  platform: PreviewPlatformType;
  channel: string;
  channelHandle?: string;
  viewerData?: PlatformViewerData;
  themeMode?: ThemeMode;
  isGlobalMuted: boolean;
  isTheaterFocus?: boolean;
  onSetTheaterFocus?: () => void;
  onOpenProfileModal?: () => void;
}

const PLATFORM_META: Record<PreviewPlatformType, {
  name: string;
  brandColor: string;
  borderActive: string;
  bgBadge: string;
  textBadge: string;
  creatorDashboardUrl: (channel: string) => string;
  creatorDashboardName: string;
  defaultIngest: string;
}> = {
  twitch: {
    name: 'Twitch',
    brandColor: '#9146FF',
    borderActive: 'border-purple-500/40 hover:border-purple-500/60',
    bgBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    textBadge: 'text-purple-400',
    creatorDashboardUrl: (chan) => `https://dashboard.twitch.tv/u/${encodeURIComponent(chan || 'me')}/stream-manager`,
    creatorDashboardName: 'Twitch Stream Manager',
    defaultIngest: 'rtmp://live.twitch.tv/app/{stream_key}',
  },
  kick: {
    name: 'Kick',
    brandColor: '#53FC18',
    borderActive: 'border-green-500/40 hover:border-green-500/60',
    bgBadge: 'bg-green-500/15 text-green-300 border-green-500/30',
    textBadge: 'text-green-400',
    creatorDashboardUrl: () => 'https://kick.com/dashboard/stream',
    creatorDashboardName: 'Kick Creator Dashboard',
    defaultIngest: 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/{stream_key}',
  },
  youtube: {
    name: 'YouTube Live',
    brandColor: '#FF0000',
    borderActive: 'border-red-500/40 hover:border-red-500/60',
    bgBadge: 'bg-red-500/15 text-red-300 border-red-500/30',
    textBadge: 'text-red-400',
    creatorDashboardUrl: () => 'https://studio.youtube.com/channel/live',
    creatorDashboardName: 'YouTube Live Control Room',
    defaultIngest: 'rtmp://a.rtmp.youtube.com/live2',
  },
  tiktok: {
    name: 'TikTok LIVE',
    brandColor: '#FE2C55',
    borderActive: 'border-pink-500/40 hover:border-pink-500/60',
    bgBadge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    textBadge: 'text-pink-400',
    creatorDashboardUrl: () => 'https://livecenter.tiktok.com/',
    creatorDashboardName: 'TikTok Live Center / Studio',
    defaultIngest: 'TikTok Live Studio / RTMP Server',
  },
  facebook: {
    name: 'Facebook Live',
    brandColor: '#1877F2',
    borderActive: 'border-blue-500/40 hover:border-blue-500/60',
    bgBadge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    textBadge: 'text-blue-400',
    creatorDashboardUrl: () => 'https://www.facebook.com/live/producer',
    creatorDashboardName: 'Facebook Live Producer',
    defaultIngest: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  },
};

export const PlatformPreviewCard: React.FC<PlatformPreviewCardProps> = ({
  platform,
  channel,
  channelHandle,
  viewerData,
  themeMode = 'normal',
  isGlobalMuted,
  isTheaterFocus = false,
  onSetTheaterFocus,
  onOpenProfileModal,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'config'>('player');
  const [isLocalMuted, setIsLocalMuted] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [forcePreview, setForcePreview] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftCategory, setDraftCategory] = useState<string>('');
  const [draftTags, setDraftTags] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';
  const meta = PLATFORM_META[platform];

  // Load persisted draft metadata from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`streampulse_draft_${platform}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.title) setDraftTitle(parsed.title);
        if (parsed.category) setDraftCategory(parsed.category);
        if (parsed.tags) setDraftTags(parsed.tags);
      }
    } catch {
      // Ignore
    }
  }, [platform]);

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        `streampulse_draft_${platform}`,
        JSON.stringify({
          title: draftTitle,
          category: draftCategory,
          tags: draftTags,
          updatedAt: Date.now(),
        })
      );
      setSaveStatus('Borrador guardado localmente.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Error al guardar el borrador.');
    }
  };

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

  // Open stream in external tab
  const getPublicStreamUrl = (): string => {
    if (!channel) return '#';
    switch (platform) {
      case 'twitch':
        return `https://twitch.tv/${channel.replace(/^@/, '')}`;
      case 'kick':
        return `https://kick.com/${channel.replace(/^@/, '')}`;
      case 'youtube':
        return viewerData?.videoId 
          ? `https://www.youtube.com/watch?v=${viewerData.videoId}` 
          : channelHandle 
          ? `https://www.youtube.com/@${channelHandle.replace(/^@/, '')}/live` 
          : `https://www.youtube.com/watch?v=${channel}`;
      case 'facebook':
        return channel.startsWith('http') ? channel : `https://facebook.com/${channel}/live`;
      case 'tiktok':
        return `https://www.tiktok.com/@${channel.replace(/^@/, '')}/live`;
      default:
        return '#';
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl border transition-all shadow-lg overflow-hidden ${
      isTheaterFocus 
        ? 'ring-2 ring-purple-500/50 shadow-purple-500/10' 
        : ''
    } ${
      isLight 
        ? 'bg-white border-zinc-200 text-zinc-900' 
        : isDark 
        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
        : 'bg-zinc-900/90 border-zinc-800/90 text-zinc-100'
    } ${meta.borderActive}`}>
      {/* Card Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-2.5 flex-wrap ${
        isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/70 border-zinc-800'
      }`}>
        {/* Left: Platform Identity & Live Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {platform === 'twitch' && <Twitch className="w-4 h-4 text-purple-400" />}
            {platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
            {platform === 'kick' && <span className="w-2.5 h-2.5 rounded-full bg-green-400" />}
            {platform === 'tiktok' && <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
            {platform === 'facebook' && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            <span className="font-bold text-xs tracking-tight">{meta.name}</span>
          </div>

          <span className={`text-xs truncate max-w-[140px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {displayChannel}
          </span>

          {/* Live / Offline Status Pill */}
          {channel ? (
            isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>EN VIVO</span>
                <span className="font-mono font-semibold ml-0.5">({viewersCount.toLocaleString()})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>OFFLINE</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              No configurado
            </span>
          )}
        </div>

        {/* Right: Controls & Tab Switcher */}
        <div className="flex items-center gap-1.5">
          {/* View Tab Switcher: Player vs Config */}
          <div className={`flex rounded-lg p-0.5 border text-[11px] ${
            isLight ? 'bg-zinc-200/80 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('player')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                activeTab === 'player'
                  ? 'bg-purple-600 text-white shadow'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Ver reproductor de video en directo"
            >
              Reproductor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                activeTab === 'config'
                  ? 'bg-purple-600 text-white shadow'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Configuración de transmisión para esta plataforma (Próximamente)"
            >
              <Settings2 className="w-3 h-3" />
              <span>Configuración</span>
            </button>
          </div>

          {/* Quick Action Icons for Player Mode */}
          {activeTab === 'player' && channel && (
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

              {/* Theater Focus Toggle */}
              {onSetTheaterFocus && (
                <button
                  type="button"
                  onClick={onSetTheaterFocus}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isTheaterFocus
                      ? 'text-purple-400 bg-purple-500/20 border-purple-500/50'
                      : isLight ? 'text-zinc-500 hover:text-zinc-800 bg-zinc-100 border-zinc-200' : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
                  }`}
                  title={isTheaterFocus ? 'Salir de Modo Teatro' : 'Enfocar este stream en grande (Modo Teatro)'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

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

          {/* External Link */}
          {channel && (
            <a
              href={getPublicStreamUrl()}
              target="_blank"
              rel="noreferrer"
              className={`p-1.5 rounded-lg border transition-colors ${
                isLight ? 'text-zinc-500 hover:text-zinc-800 bg-zinc-100 border-zinc-200' : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
              }`}
              title={`Abrir ${meta.name} en pestaña nueva`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="relative min-h-[280px] flex-1 flex flex-col justify-center bg-black/40">
        {activeTab === 'player' ? (
          /* TAB 1: Live Video Player */
          !channel ? (
            /* Unconfigured State */
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 text-zinc-400">
                <Tv2 className="w-7 h-7 opacity-75" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Canal no configurado</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Agrega tu usuario o ID de {meta.name} para visualizar el stream en directo.
                </p>
              </div>
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="mt-1 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all"
                >
                  Configurar Canal
                </button>
              )}
            </div>
          ) : !isLive && !forcePreview ? (
            /* Standby / Offline State */
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500">
                <WifiOff className="w-7 h-7 opacity-60" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  Transmisión Offline en {meta.name}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                  El reproductor se activará automáticamente al detectar la transmisión en vivo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForcePreview(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 text-purple-400 fill-current" />
                <span>Cargar reproductor de todos modos</span>
              </button>
            </div>
          ) : (
            /* Real Video Player Embed */
            <div className="w-full h-full relative aspect-video bg-black flex items-center justify-center">
              <iframe
                key={`${embedUrl}-${reloadKey}-${isEffectiveMuted}`}
                src={embedUrl}
                title={`${meta.name} Live Player`}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            </div>
          )
        ) : (
          /* TAB 2: Stream Configuration Drawer (Próximamente / En Desarrollo) */
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Ajustes de Stream en {meta.name}
                  </h4>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Próximamente (API)
                </span>
              </div>

              {saveStatus && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{saveStatus}</span>
                </div>
              )}

              <form onSubmit={handleSaveDraft} className="space-y-3 mt-3">
                {/* Stream Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Título de la Emisión:
                  </label>
                  <input
                    type="text"
                    placeholder={`ej. ¡Directo en vivo en ${meta.name}! | Charlando y Jugando`}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Category / Game */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Categoría / Juego:
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Diablo II, Just Chatting..."
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value)}
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
                      onChange={(e) => setDraftTags(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Ingest Server info */}
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] space-y-1">
                  <span className="text-zinc-400 block font-medium">Servidor Ingest RTMP recomendado:</span>
                  <code className="text-purple-300 font-mono text-[10px] break-all block">
                    {meta.defaultIngest}
                  </code>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-colors shadow-sm"
                  >
                    Guardar Borrador
                  </button>

                  <a
                    href={meta.creatorDashboardUrl(channel)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors ml-auto"
                  >
                    <span>Abrir {meta.creatorDashboardName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </div>

            <div className="text-[11px] text-zinc-500 flex items-start gap-1.5 pt-2 border-t border-zinc-800/80">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Próximamente: podrás enviar el cambio de título, tags y categoría directamente a la API oficial de cada plataforma desde este panel centralizado.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
