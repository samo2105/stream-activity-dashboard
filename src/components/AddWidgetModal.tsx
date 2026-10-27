import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  HelpCircle, 
  Sparkles,
  Info,
  AlertTriangle
} from 'lucide-react';
import { WidgetItem, WidgetPlatform, ChannelsConfig } from '../types/widget';
import { PLATFORM_PRESETS, DEFAULT_STREAMLABS_TOKEN } from '../utils/presets';
import { extractCleanUrl, validateWidgetUrl } from '../utils/urlHelper';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetData: Omit<WidgetItem, 'id' | 'createdAt'>, existingId?: string) => void;
  editingWidget?: WidgetItem | null;
  channels: ChannelsConfig;
}

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

  // Quick helper inputs for specific platforms
  const [channelName, setChannelName] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');
  const [streamlabsWidgetType, setStreamlabsWidgetType] = useState<'eventlist' | 'chatbox' | 'alertbox'>('eventlist');
  const [streamlabsToken, setStreamlabsToken] = useState<string>('');

  const currentHost = typeof window !== 'undefined' && window.location.hostname 
    ? window.location.hostname 
    : 'localhost';

  const applyPrepopulation = (targetPlatform: WidgetPlatform, typeOverride?: 'eventlist' | 'chatbox' | 'alertbox') => {
    const p = PLATFORM_PRESETS[targetPlatform];
    const effectiveToken = channels.streamlabsToken || DEFAULT_STREAMLABS_TOKEN;
    const effectiveType = typeOverride || streamlabsWidgetType;

    if (targetPlatform === 'twitch') {
      const user = (channels.twitch || 'samo2105').replace(/^@/, '');
      setChannelName(user);
      setTitle(`Twitch Chat (${user})`);
      setUrl(`https://www.twitch.tv/embed/${user}/chat?parent=${currentHost}&parent=samo2105.github.io&darkpopout`);
    } else if (targetPlatform === 'kick') {
      const user = (channels.kick || '').replace(/^@/, '');
      setChannelName(user);
      setTitle(user ? `Kick Chat (${user})` : p.defaultTitle);
      setUrl(user ? `https://kick.com/popout/${user}/chat` : '');
    } else if (targetPlatform === 'youtube') {
      const ytStreamId = channels.youtube || 'SwjSwFWmxl0';
      const handle = channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : (channels.youtube === 'SwjSwFWmxl0' ? '@zannito' : ytStreamId);
      setYoutubeVideoId(ytStreamId);
      setTitle(`YouTube Live Chat (${handle})`);
      setUrl(`https://www.youtube.com/live_chat?v=${ytStreamId}&embed_domain=${currentHost}&dark_theme=1`);
    } else if (targetPlatform === 'streamlabs' || targetPlatform === 'eventlist' || targetPlatform === 'chatbox') {
      setStreamlabsToken(effectiveToken);
      const isChat = targetPlatform === 'chatbox' || (targetPlatform === 'streamlabs' && effectiveType === 'chatbox');
      const isAlert = targetPlatform === 'streamlabs' && effectiveType === 'alertbox';

      if (isChat) {
        setTitle('Streamlabs Chat Box');
        setUrl(`https://streamlabs.com/widgets/chat-box/v1/${effectiveToken}`);
      } else if (isAlert) {
        setTitle('Streamlabs Alert Box');
        setUrl(`https://streamlabs.com/alert-box/v3/${effectiveToken}`);
      } else {
        setTitle('Streamlabs Event List');
        setUrl(`https://streamlabs.com/widgets/event-list/v1/${effectiveToken}`);
      }
    } else {
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
    } else if (isOpen) {
      applyPrepopulation(platform);
    }
  }, [editingWidget, isOpen]);

  if (!isOpen) return null;

  const currentPreset = PLATFORM_PRESETS[platform];

  const handlePlatformChange = (newPlatform: WidgetPlatform) => {
    setPlatform(newPlatform);
    if (!editingWidget) {
      applyPrepopulation(newPlatform);
    }
  };

  const handleSelectStreamlabsType = (type: 'eventlist' | 'chatbox' | 'alertbox') => {
    setStreamlabsWidgetType(type);
    applyPrepopulation(platform, type);
  };

  const handleStreamlabsTokenChange = (raw: string) => {
    let token = raw.trim();
    const tokenMatch = token.match(/\/v[1-3]\/([a-zA-Z0-9]{60,})/);
    if (tokenMatch && tokenMatch[1]) {
      token = tokenMatch[1];
    }
    setStreamlabsToken(token);

    if (platform === 'chatbox' || streamlabsWidgetType === 'chatbox') {
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
    } else if (id.toLowerCase() === 'zannito' || id.toLowerCase() === '@zannito' || id.includes('zannito')) {
      id = 'SwjSwFWmxl0';
    }
    const ytUrl = `https://www.youtube.com/live_chat?v=${id}&embed_domain=${currentHost}&dark_theme=1`;
    setUrl(ytUrl);
    if (!editingWidget || title.startsWith('YouTube')) {
      setTitle(id === 'SwjSwFWmxl0' ? 'YouTube Chat (@zannito - Warlock de Abismo)' : `YouTube Chat (${id})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = extractCleanUrl(url);
    if (!title.trim() || !cleanUrl) return;

    onSave(
      {
        title: title.trim(),
        platform,
        url: cleanUrl,
        columnSpan,
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(PLATFORM_PRESETS) as WidgetPlatform[]).map((pKey) => {
                const item = PLATFORM_PRESETS[pKey];
                const isSelected = platform === pKey;
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
                    streamlabsWidgetType === 'eventlist' || platform === 'eventlist'
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
                    streamlabsWidgetType === 'chatbox' || platform === 'chatbox'
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
              <button
                type="button"
                onClick={() => handleGenerateYoutubeUrl('SwjSwFWmxl0')}
                className="w-full text-[11px] text-red-300 hover:text-white bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-left"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>En directo ahora: <strong>@zannito</strong> (Warlock de Abismo)</span>
                </span>
                <span className="font-mono text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                  ID: SwjSwFWmxl0
                </span>
              </button>
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
