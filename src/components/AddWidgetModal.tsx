import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  HelpCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import { WidgetItem, WidgetPlatform } from '../types/widget';
import { PLATFORM_PRESETS } from '../utils/presets';
import { extractCleanUrl } from '../utils/urlHelper';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetData: Omit<WidgetItem, 'id' | 'createdAt'>, existingId?: string) => void;
  editingWidget?: WidgetItem | null;
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWidget,
}) => {
  const [platform, setPlatform] = useState<WidgetPlatform>('eventlist');
  const [title, setTitle] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [columnSpan, setColumnSpan] = useState<1 | 2>(1);

  // Quick helper inputs for specific platforms
  const [channelName, setChannelName] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');

  useEffect(() => {
    if (editingWidget) {
      setPlatform(editingWidget.platform);
      setTitle(editingWidget.title);
      setUrl(editingWidget.url);
      setColumnSpan(editingWidget.columnSpan || 1);
    } else {
      const preset = PLATFORM_PRESETS[platform];
      setTitle(preset.defaultTitle);
      setUrl('');
      setColumnSpan(1);
      setChannelName('');
      setYoutubeVideoId('');
    }
  }, [editingWidget, isOpen, platform]);

  if (!isOpen) return null;

  const currentPreset = PLATFORM_PRESETS[platform];
  const currentHost = window.location.hostname || 'localhost';

  const handlePlatformChange = (newPlatform: WidgetPlatform) => {
    setPlatform(newPlatform);
    const p = PLATFORM_PRESETS[newPlatform];
    if (!editingWidget) {
      setTitle(p.defaultTitle);
      setUrl('');
    }
  };

  const handleGenerateTwitchUrl = (user: string) => {
    setChannelName(user);
    if (!user.trim()) return;
    const cleanUser = user.trim().toLowerCase();
    // Twitch embed format requires parent parameter to allow iframe rendering
    const twitchEmbedUrl = `https://www.twitch.tv/embed/${cleanUser}/chat?parent=${currentHost}&parent=samo2105.github.io&darkpopout`;
    setUrl(twitchEmbedUrl);
    if (!editingWidget || title.startsWith('Twitch')) {
      setTitle(`Twitch Chat (${cleanUser})`);
    }
  };

  const handleGenerateKickUrl = (user: string) => {
    setChannelName(user);
    if (!user.trim()) return;
    const cleanUser = user.trim().toLowerCase();
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
    const ytUrl = `https://www.youtube.com/live_chat?v=${id}&embed_domain=${currentHost}`;
    setUrl(ytUrl);
    if (!editingWidget || title.startsWith('YouTube')) {
      setTitle(`YouTube Chat (${id})`);
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

          {/* Quick Notice for Event List & Chat Box */}
          {(platform === 'eventlist' || platform === 'chatbox') && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Info className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{platform === 'eventlist' ? 'URL de Event List' : 'URL de Chat Box'}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {platform === 'eventlist'
                  ? 'Puedes usar la URL de la fuente de navegador de Streamlabs Event List, StreamElements Activity Feed, o cualquier lista de eventos en vivo.'
                  : 'Puedes pegar la URL del widget de Chat Box de Streamlabs, StreamElements o BotRix (que unifica chats de Twitch, Kick y YouTube sin problemas de login).'}
              </p>
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
                  placeholder="Pega la URL o ID del stream (ej. dQw4w9WgXcQ)"
                  value={youtubeVideoId}
                  onChange={(e) => handleGenerateYoutubeUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-red-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
                />
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
