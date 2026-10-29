import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  HelpCircle, 
  Sparkles,
  Info,
  AlertTriangle,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { WidgetItem, WidgetPlatform, ChannelsConfig, ThemeMode } from '../types/widget';
import { PLATFORM_PRESETS, DEFAULT_STREAMLABS_TOKEN } from '../utils/presets';
import { extractCleanUrl, validateWidgetUrl, generateFacebookEmbedUrl, generateTikTokEmbedUrl } from '../utils/urlHelper';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetData: Omit<WidgetItem, 'id' | 'createdAt'>, existingId?: string) => void;
  editingWidget?: WidgetItem | null;
  channels: ChannelsConfig;
}

const TOP_SELECTOR_PLATFORMS: WidgetPlatform[] = [
  'streamlabs',
  'streamelements',
  'twitch',
  'kick',
  'youtube',
  'facebook',
  'botrix',
  'tiktok',
  'custom',
];

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWidget,
  channels,
}) => {
  const [platform, setPlatform] = useState<WidgetPlatform>('eventlist');
  const [title, setTitle] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [columnSpan, setColumnSpan] = useState<1 | 2>(1);
  const [themeMode, setThemeMode] = useState<ThemeMode>('normal');
  const [fontScale, setFontScale] = useState<number>(1.0);

  // Quick helper inputs for specific platforms
  const [channelName, setChannelName] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');
  const [facebookInput, setFacebookInput] = useState<string>('');
  const [facebookMode, setFacebookMode] = useState<'player' | 'chat'>('player');
  const [tiktokInput, setTiktokInput] = useState<string>('');
  const [tiktokMode, setTiktokMode] = useState<'player' | 'chat'>('player');
  const [streamlabsWidgetType, setStreamlabsWidgetType] = useState<'eventlist' | 'chatbox' | 'alertbox'>('eventlist');
  const [streamlabsToken, setStreamlabsToken] = useState<string>('');

  const currentHost = typeof window !== 'undefined' && window.location.hostname 
    ? window.location.hostname 
    : 'localhost';

  const applyPrepopulation = (targetPlatform: WidgetPlatform, typeOverride?: 'eventlist' | 'chatbox' | 'alertbox') => {
    const effectiveToken = streamlabsToken || channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN;
    const effectiveType = typeOverride || streamlabsWidgetType;

    if (targetPlatform === 'twitch') {
      const user = (channelName || channels.twitch || 'samo2105').replace(/^@/, '');
      setChannelName(user);
      setTitle(`Twitch Chat (${user})`);
      setUrl(`https://www.twitch.tv/embed/${user}/chat?parent=${currentHost}&parent=samo2105.github.io&darkpopout`);
    } else if (targetPlatform === 'kick') {
      const user = (channelName || channels.kick || '').replace(/^@/, '');
      setChannelName(user);
      setTitle(user ? `Kick Chat (${user})` : 'Kick Chat');
      setUrl(user ? `https://kick.com/popout/${user}/chat` : '');
    } else if (targetPlatform === 'youtube') {
      const ytStreamId = youtubeVideoId || channels.youtube || 'SwjSwFWmxl0';
      const handle = channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : (channels.youtube === 'SwjSwFWmxl0' ? '@zannito' : ytStreamId);
      setYoutubeVideoId(ytStreamId);
      setTitle(`YouTube Live Chat (${handle})`);
      setUrl(`https://www.youtube.com/live_chat?v=${ytStreamId}&embed_domain=${currentHost}&dark_theme=1`);
    } else if (targetPlatform === 'facebook') {
      const fbTarget = facebookInput || channels.facebook || '';
      setFacebookInput(fbTarget);
      const generated = generateFacebookEmbedUrl(fbTarget, facebookMode);
      setUrl(generated);
      const cleanName = fbTarget.replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/\/.*$/, '') || 'Live';
      setTitle(facebookMode === 'player' ? `Facebook Live Player (${cleanName})` : `Facebook Chat (${cleanName})`);
    } else if (targetPlatform === 'tiktok') {
      const ttTarget = tiktokInput || channels.tiktok || '';
      setTiktokInput(ttTarget);
      const generated = generateTikTokEmbedUrl(ttTarget, tiktokMode);
      setUrl(generated);
      const cleanName = ttTarget
        .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
        .replace(/\/live\/?.*$/i, '')
        .replace(/\/.*$/i, '')
        .replace(/^@+/, '') || 'Live';
      setTitle(tiktokMode === 'player' ? `TikTok LIVE Player (@${cleanName})` : `TikTok Live Chat (@${cleanName})`);
    } else if (targetPlatform === 'streamlabs' || targetPlatform === 'eventlist' || targetPlatform === 'chatbox') {
      setStreamlabsToken(effectiveToken);

      if (effectiveType === 'chatbox') {
        setPlatform('chatbox');
        setStreamlabsWidgetType('chatbox');
        setTitle('Streamlabs Chat Box');
        setUrl(`https://streamlabs.com/widgets/chat-box/v1/${effectiveToken}`);
      } else if (effectiveType === 'alertbox') {
        setPlatform('streamlabs');
        setStreamlabsWidgetType('alertbox');
        setTitle('Streamlabs Alert Box');
        setUrl(`https://streamlabs.com/alert-box/v3/${effectiveToken}`);
      } else {
        setPlatform('eventlist');
        setStreamlabsWidgetType('eventlist');
        setTitle('Streamlabs Event List');
        setUrl(`https://streamlabs.com/widgets/event-list/v1/${effectiveToken}`);
      }
    } else {
      const p = PLATFORM_PRESETS[targetPlatform] || PLATFORM_PRESETS.custom;
      setTitle(p.defaultTitle);
      setUrl('');
    }
  };

  useEffect(() => {
    if (editingWidget) {
      setPlatform(editingWidget.platform);
      setTitle(editingWidget.title);
      setUrl(editingWidget.url);
      setColumnSpan(editingWidget.columnSpan || 1);

      // Extract and pre-fill quick generator fields
      if (editingWidget.platform === 'twitch' || editingWidget.url.includes('twitch.tv')) {
        const twitchMatch = editingWidget.url.match(/twitch\.tv\/(?:embed|popout)\/([a-zA-Z0-9_]+)/i);
        setChannelName((twitchMatch && twitchMatch[1]) || channels.twitch || '');
      } else if (editingWidget.platform === 'kick' || editingWidget.url.includes('kick.com')) {
        const kickMatch = editingWidget.url.match(/kick\.com\/popout\/([a-zA-Z0-9_]+)/i);
        setChannelName((kickMatch && kickMatch[1]) || channels.kick || '');
      } else if (editingWidget.platform === 'youtube' || editingWidget.url.includes('youtube.com')) {
        let ytId = '';
        if (editingWidget.url.includes('v=')) {
          ytId = editingWidget.url.split('v=')[1]?.split('&')[0] || '';
        }
        setYoutubeVideoId(ytId || channels.youtube || '');
      } else if (editingWidget.platform === 'facebook' || editingWidget.url.includes('facebook.com')) {
        setFacebookInput(channels.facebook || '');
        if (editingWidget.url.includes('comments')) {
          setFacebookMode('chat');
        } else {
          setFacebookMode('player');
        }
      } else if (editingWidget.platform === 'tiktok' || editingWidget.url.includes('tiktok.com')) {
        const ttMatch = editingWidget.url.match(/tiktok\.com\/@?([a-zA-Z0-9_.-]+)/i);
        const ttUser = (ttMatch && ttMatch[1]) || channels.tiktok || '';
        setTiktokInput(ttUser);
        if (editingWidget.title.toLowerCase().includes('chat')) {
          setTiktokMode('chat');
        } else {
          setTiktokMode('player');
        }
      } else if (
        editingWidget.platform === 'streamlabs' || 
        editingWidget.platform === 'eventlist' || 
        editingWidget.platform === 'chatbox' || 
        editingWidget.url.includes('streamlabs.com')
      ) {
        const tokenMatch = editingWidget.url.match(/\/v[1-3]\/([a-zA-Z0-9]{60,})/);
        const token = (tokenMatch && tokenMatch[1]) || channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN;
        setStreamlabsToken(token);

        if (editingWidget.url.includes('chat-box') || editingWidget.platform === 'chatbox') {
          setStreamlabsWidgetType('chatbox');
        } else if (editingWidget.url.includes('alert-box')) {
          setStreamlabsWidgetType('alertbox');
        } else {
          setStreamlabsWidgetType('eventlist');
        }
      }
      setThemeMode(editingWidget.themeMode || (editingWidget.highContrast ? 'dark' : 'normal'));
      setFontScale(editingWidget.fontScale || 1.0);
    } else if (isOpen) {
      setColumnSpan(1);
      setThemeMode('normal');
      setFontScale(1.0);
      applyPrepopulation(platform);
    }
  }, [editingWidget, isOpen]);

  if (!isOpen) return null;

  const currentPreset = PLATFORM_PRESETS[platform] || PLATFORM_PRESETS.custom;

  const handlePlatformChange = (newPlatform: WidgetPlatform) => {
    setPlatform(newPlatform);
    applyPrepopulation(newPlatform);
  };

  const handleSelectStreamlabsType = (type: 'eventlist' | 'chatbox' | 'alertbox') => {
    applyPrepopulation('streamlabs', type);
  };

  const handleStreamlabsTokenChange = (raw: string) => {
    let token = raw.trim();
    const tokenMatch = token.match(/\/v[1-3]\/([a-zA-Z0-9]{60,})/);
    if (tokenMatch && tokenMatch[1]) {
      token = tokenMatch[1];
    }
    setStreamlabsToken(token);

    if (streamlabsWidgetType === 'chatbox' || platform === 'chatbox') {
      setUrl(`https://streamlabs.com/widgets/chat-box/v1/${token}`);
    } else if (streamlabsWidgetType === 'alertbox') {
      setUrl(`https://streamlabs.com/alert-box/v3/${token}`);
    } else {
      setUrl(`https://streamlabs.com/widgets/event-list/v1/${token}`);
    }
  };

  const handleGenerateTwitchUrl = (user: string) => {
    setChannelName(user);
    if (!user.trim()) return;
    const cleanUser = user.trim().replace(/^@/, '').toLowerCase();
    const twitchEmbedUrl = `https://www.twitch.tv/embed/${cleanUser}/chat?parent=${currentHost}&parent=samo2105.github.io&darkpopout`;
    setUrl(twitchEmbedUrl);
    if (!editingWidget || title.startsWith('Twitch')) {
      setTitle(`Twitch Chat (${cleanUser})`);
    }
  };

  const handleGenerateKickUrl = (user: string) => {
    setChannelName(user);
    if (!user.trim()) return;
    const cleanUser = user.trim().replace(/^@/, '').toLowerCase();
    const kickUrl = `https://kick.com/popout/${cleanUser}/chat`;
    setUrl(kickUrl);
    if (!editingWidget || title.startsWith('Kick')) {
      setTitle(`Kick Chat (${cleanUser})`);
    }
  };

  const handleGenerateYoutubeUrl = (videoIdOrUrl: string) => {
    setYoutubeVideoId(videoIdOrUrl);
    let id = videoIdOrUrl.trim();
    if (id.includes('v=')) {
      id = id.split('v=')[1]?.split('&')[0] || id;
    } else if (id.includes('youtu.be/')) {
      id = id.split('youtu.be/')[1]?.split('?')[0] || id;
    } else if (id.includes('live/')) {
      id = id.split('live/')[1]?.split('?')[0] || id;
    }
    const cleanId = id.replace(/^@/, '');
    const ytUrl = `https://www.youtube.com/live_chat?v=${cleanId}&embed_domain=${currentHost}&dark_theme=1`;
    setUrl(ytUrl);
    if (!editingWidget || title.startsWith('YouTube')) {
      setTitle(cleanId ? `YouTube Chat (${cleanId})` : 'YouTube Chat');
    }
  };

  const handleGenerateFacebookUrl = (inputVal: string, modeOverride?: 'player' | 'chat') => {
    setFacebookInput(inputVal);
    const mode = modeOverride || facebookMode;
    const generated = generateFacebookEmbedUrl(inputVal, mode);
    setUrl(generated);
    if (!editingWidget || title.startsWith('Facebook')) {
      const cleanName = inputVal.replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/\/.*$/, '') || 'Live';
      setTitle(mode === 'player' ? `Facebook Live Player (${cleanName})` : `Facebook Chat (${cleanName})`);
    }
  };

  const handleGenerateTikTokUrl = (inputVal: string, modeOverride?: 'player' | 'chat') => {
    setTiktokInput(inputVal);
    const mode = modeOverride || tiktokMode;
    const generated = generateTikTokEmbedUrl(inputVal, mode);
    setUrl(generated);
    if (!editingWidget || title.startsWith('TikTok')) {
      const cleanName = inputVal
        .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
        .replace(/\/live\/?.*$/i, '')
        .replace(/\/.*$/i, '')
        .replace(/^@+/, '') || 'Live';
      setTitle(mode === 'player' ? `TikTok LIVE Player (@${cleanName})` : `TikTok Live Chat (@${cleanName})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = extractCleanUrl(url);
    if (!title.trim() || !cleanUrl) {
      alert('Por favor ingresa un título y una URL válida para el widget.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        platform,
        url: cleanUrl,
        columnSpan,
        themeMode,
        fontScale: fontScale !== 1.0 ? fontScale : undefined,
        highContrast: themeMode === 'dark',
      },
      editingWidget?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {editingWidget ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingWidget ? 'Editar Widget de Stream' : 'Añadir Widget de Eventos / Chat'}
              </h2>
              <p className="text-xs text-zinc-400">
                Pega la URL de tu Event List, Chat Box o selecciona una plantilla
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Main Category / Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Tipo de Fuente o Widget
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TOP_SELECTOR_PLATFORMS.map((pKey) => {
                const item = PLATFORM_PRESETS[pKey];
                const isSelected = platform === pKey || (pKey === 'streamlabs' && (platform === 'eventlist' || platform === 'chatbox'));
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handlePlatformChange(pKey)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? `${item.badgeBg} border-current font-semibold scale-[1.02] shadow`
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs">{item.badgeText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Helper for Streamlabs / Event List / Chat Box */}
          {(platform === 'streamlabs' || platform === 'eventlist' || platform === 'chatbox') && (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Configuración de Streamlabs:
                </label>
                <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 font-medium">
                  Pre-rellenado con tus canales
                </span>
              </div>

              {/* Subtype buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectStreamlabsType('eventlist')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    streamlabsWidgetType === 'eventlist'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  📋 Event List
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStreamlabsType('chatbox')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    streamlabsWidgetType === 'chatbox'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  💬 Chat Box
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStreamlabsType('alertbox')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    streamlabsWidgetType === 'alertbox'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🚨 Alert Box
                </button>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">
                  Token de Streamlabs (extraído de tus canales):
                </span>
                <input
                  type="text"
                  placeholder="36D393A46BDD... o pega la URL completa de tu widget"
                  value={streamlabsToken}
                  onChange={(e) => handleStreamlabsTokenChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-teal-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  Conecta directamente con el WebSocket oficial de Streamlabs sin requerir login en el navegador.
                </span>
              </div>
            </div>
          )}

          {/* Platform Quick Generator Helper for Twitch */}
          {platform === 'twitch' && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <label className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generador de Embed Oficial de Twitch:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tu nombre de canal (ej. samo2105)"
                  value={channelName}
                  onChange={(e) => handleGenerateTwitchUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-purple-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                ⚠️ Twitch requiere el parámetro <code>parent={currentHost}</code> para autorizar el iframe. Si tu navegador bloquea cookies de terceros en Twitch, te recomendamos usar la opción <strong>Chat Box</strong> de Streamlabs o BotRix.
              </p>
            </div>
          )}

          {platform === 'kick' && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
              <label className="text-xs font-medium text-green-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generador Rápido de Chat de Kick:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tu canal de Kick (ej. samo2105)"
                  value={channelName}
                  onChange={(e) => handleGenerateKickUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-green-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-400"
                />
              </div>
            </div>
          )}

          {platform === 'youtube' && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
              <label className="text-xs font-medium text-red-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generador de Chat en Vivo de YouTube:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe zannito o pega la URL/ID del stream"
                  value={youtubeVideoId}
                  onChange={(e) => handleGenerateYoutubeUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-red-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
                />
              </div>
              {channels.youtube && (
                <button
                  type="button"
                  onClick={() => handleGenerateYoutubeUrl(channels.youtube)}
                  className="w-full text-[11px] text-zinc-300 hover:text-white bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-800 px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                    <span>Cargar canal/stream configurado ({channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : channels.youtube})</span>
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700">
                    {channels.youtube}
                  </span>
                </button>
              )}
            </div>
          )}

          {platform === 'facebook' && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Generador de Facebook Live:
                </label>
                <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFacebookMode('player');
                      handleGenerateFacebookUrl(facebookInput, 'player');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      facebookMode === 'player'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Reproductor Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFacebookMode('chat');
                      handleGenerateFacebookUrl(facebookInput, 'chat');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      facebookMode === 'chat'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Chat / Comentarios
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="ej. TuPagina o https://facebook.com/TuPagina/live"
                  value={facebookInput}
                  onChange={(e) => handleGenerateFacebookUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-blue-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400"
                />
                <p className="text-[11px] text-zinc-400">
                  {facebookMode === 'player'
                    ? 'Incrusta el reproductor oficial de video en vivo de Facebook con reproducción automática adaptativa.'
                    : 'Incrusta el plugin de comentarios en directo de Facebook. Para chats unificados sin login, también puedes usar Streamlabs o BotRix.'}
                </p>
              </div>
            </div>
          )}

          {platform === 'tiktok' && (
            <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-pink-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Generador de TikTok LIVE (Modo B):
                </label>
                <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTiktokMode('player');
                      handleGenerateTikTokUrl(tiktokInput, 'player');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      tiktokMode === 'player'
                        ? 'bg-pink-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Reproductor en Vivo (Live Preview)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTiktokMode('chat');
                      handleGenerateTikTokUrl(tiktokInput, 'chat');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                      tiktokMode === 'chat'
                        ? 'bg-pink-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Chat en Vivo / Overlay
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="ej. @usuario o https://www.tiktok.com/@usuario/live (o URL TikFinity)"
                  value={tiktokInput}
                  onChange={(e) => handleGenerateTikTokUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-pink-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-400"
                />
                <p className="text-[11px] text-zinc-400">
                  {tiktokMode === 'player'
                    ? 'Incrusta el reproductor oficial de TikTok LIVE (Live Preview) para previsualizar y monitorear la emisión en directo en tiempo real.'
                    : 'Incrusta el chat en vivo web de TikTok LIVE (Modo B) o tu enlace de widget de chat de TikFinity/BotRix.'}
                </p>
              </div>
            </div>
          )}

          {/* Guide hint for Event Feeds */}
          {(platform === 'streamlabs' || platform === 'streamelements' || platform === 'botrix') && (
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                {currentPreset.guideText}
              </p>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Título del Widget
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Lista de Eventos / Chat Box"
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              URL del Widget Web / Eventos
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentPreset.placeholderUrl}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-xs transition-all"
            />
            {validateWidgetUrl(url).warning && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{validateWidgetUrl(url).warning}</span>
              </div>
            )}
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>La URL se almacenará de manera privada y local en tu navegador.</span>
            </p>
          </div>

          {/* Column Span */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Ancho de la Tarjeta en el Panel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setColumnSpan(1)}
                className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all ${
                  columnSpan === 1
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Columna Normal (1x)
              </button>
              <button
                type="button"
                onClick={() => setColumnSpan(2)}
                className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all ${
                  columnSpan === 2
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Columna Ancha (2x)
              </button>
            </div>
          </div>

          {/* Theme Mode Selector: Normal | Oscuro | Claro */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Modo de Visualización del Widget
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode('normal')}
                className={`py-2 px-2 text-xs rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'normal'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-purple-400" />
                <span>Normal</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`py-2 px-2 text-xs rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'dark'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Oscuro (Negro)</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`py-2 px-2 text-xs rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'light'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Claro (Blanco)</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              {themeMode === 'normal' && 'Modo estándar balanceado con fondo oscuro.'}
              {themeMode === 'dark' && 'Fondo negro puro (#000000) con alto contraste y brillo mejorado.'}
              {themeMode === 'light' && 'Fondo blanco (#ffffff) ideal para chats transparentes con texto oscuro.'}
            </p>
          </div>

          {/* Font Scale / Zoom Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Tamaño de Fuente / Escala del Frame</span>
              <span className="text-purple-400 font-mono font-bold text-xs">{Math.round(fontScale * 100)}%</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[
                { scale: 0.75, label: '75%' },
                { scale: 0.85, label: '85%' },
                { scale: 1.0, label: '100%' },
                { scale: 1.15, label: '115%' },
                { scale: 1.3, label: '130%' },
                { scale: 1.5, label: '150%' },
                { scale: 1.75, label: '175%' },
                { scale: 2.0, label: '200%' },
              ].map(({ scale, label }) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setFontScale(scale)}
                  className={`py-1.5 text-xs rounded-lg border font-mono transition-all ${
                    fontScale === scale
                      ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-sm'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Aumenta o reduce la fuente de este widget (útil para leer chats o listas de eventos a distancia).
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/25 transition-all"
          >
            <Save className="w-4 h-4" />
            {editingWidget ? 'Guardar Cambios' : 'Añadir al Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};
