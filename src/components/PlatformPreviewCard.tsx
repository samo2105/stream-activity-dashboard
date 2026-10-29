import React, { useState, useEffect } from 'react';
import { 
  Tv2, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Maximize2, 
  Settings2, 
  Sliders, 
  Play, 
  WifiOff, 
  Check, 
  Info,
  Youtube,
  Twitch,
  ExternalLink
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

export const PlatformLogo: React.FC<{ platform: PreviewPlatformType; className?: string }> = ({ 
  platform, 
  className = 'w-4 h-4 shrink-0' 
}) => {
  switch (platform) {
    case 'twitch':
      return <Twitch className={`${className} text-[#9146FF]`} />;
    case 'kick':
      return (
        <svg className={`${className} text-[#53FC18] fill-current`} viewBox="0 0 24 24">
          <path d="M4 3h4v6.5l4.5-6.5h5l-5.8 8 6.3 10h-5.2L8 13.5V21H4V3z" />
        </svg>
      );
    case 'youtube':
      return <Youtube className={`${className} text-[#FF0000]`} />;
    case 'tiktok':
      return (
        <svg className={`${className} text-[#FE2C55] fill-current`} viewBox="0 0 24 24">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.312-4.634c.316 0 .62.052.906.148V9.45a6.335 6.335 0 0 0-.906-.065 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.756a8.21 8.21 0 0 0 4.764 1.503V6.814a4.82 4.82 0 0 1-1-.128z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className={`${className} text-[#1877F2] fill-current`} viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    default:
      return <Tv2 className={`${className} text-zinc-400`} />;
  }
};

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
    name: 'YouTube',
    brandColor: '#FF0000',
    borderActive: 'border-red-500/40 hover:border-red-500/60',
    bgBadge: 'bg-red-500/15 text-red-300 border-red-500/30',
    textBadge: 'text-red-400',
    creatorDashboardUrl: () => 'https://studio.youtube.com/channel/live',
    creatorDashboardName: 'YouTube Live Control Room',
    defaultIngest: 'rtmp://a.rtmp.youtube.com/live2',
  },
  tiktok: {
    name: 'TikTok',
    brandColor: '#FE2C55',
    borderActive: 'border-pink-500/40 hover:border-pink-500/60',
    bgBadge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    textBadge: 'text-pink-400',
    creatorDashboardUrl: () => 'https://livecenter.tiktok.com/',
    creatorDashboardName: 'TikTok Live Center / Studio',
    defaultIngest: 'TikTok Live Studio / RTMP Server',
  },
  facebook: {
    name: 'Facebook',
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
          <div className="flex items-center gap-2 shrink-0">
            <PlatformLogo platform={platform} className="w-4 h-4 shrink-0" />
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
        </div>
      </div>

      {/* Card Body */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {activeTab === 'player' ? (
          /* TAB 1: Live Video Player */
          !channel ? (
            /* Unconfigured State */
            <div className="w-full h-full p-4 text-center flex flex-col items-center justify-center gap-2 bg-zinc-950/90">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Tv2 className="w-6 h-6 opacity-75" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-xs font-semibold text-zinc-200">Canal no configurado</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Agrega tu usuario o ID de {meta.name} para visualizar el stream.
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
            /* Standby / Offline State - Icon and force preview button only, no text */
            <div className="w-full h-full p-4 text-center flex flex-col items-center justify-center gap-3 bg-zinc-950/90 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500" title="Offline">
                <WifiOff className="w-8 h-8 opacity-70" />
              </div>
              <button
                type="button"
                onClick={() => setForcePreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 text-purple-400 fill-current" />
                <span>Cargar reproductor</span>
              </button>
            </div>
          ) : (
            /* Real Video Player Embed */
            <iframe
              key={`${embedUrl}-${reloadKey}-${isEffectiveMuted}`}
              src={embedUrl}
              title={`${meta.name} Live Player`}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
            />
          )
        ) : (
          /* TAB 2: Stream Configuration Drawer (Próximamente / En Desarrollo) */
          <div className="w-full h-full p-4 flex flex-col justify-between overflow-y-auto bg-zinc-950/95 animate-fadeIn">
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
