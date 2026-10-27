import React, { useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { WidgetItem } from '../types/widget';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (widgets: WidgetItem[], columns: 1 | 2 | 3 | 4) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  const [channelName, setChannelName] = useState<string>('samo2105');

  if (!isOpen) return null;

  const currentHost = window.location.hostname || 'localhost';

  const presets = [
    {
      id: 'stream-hub',
      title: 'Panel Recomendado (Chatbox URL + Event List URL + Kick)',
      description: 'La configuración más estable: tu URL de Chat Box unificado, tu URL de Event List y el chat directo de Kick.',
      columns: 3 as const,
      preview: ['Chat Box (URL)', 'Event List (URL)', 'Kick Chat'],
      generate: (): WidgetItem[] => [
        {
          id: `chatbox-${Date.now()}`,
          title: 'Caja de Chat (Chat Box)',
          platform: 'chatbox',
          url: 'about:blank',
          columnSpan: 1,
          createdAt: Date.now(),
        },
        {
          id: `eventlist-${Date.now() + 1}`,
          title: 'Lista de Eventos (Event List)',
          platform: 'eventlist',
          url: 'about:blank',
          columnSpan: 1,
          createdAt: Date.now() + 1,
        },
        {
          id: `kick-${Date.now() + 2}`,
          title: `Kick Chat (${channelName})`,
          platform: 'kick',
          url: `https://kick.com/popout/${channelName}/chat`,
          columnSpan: 1,
          createdAt: Date.now() + 2,
        },
      ],
    },
    {
      id: 'dual-stream',
      title: 'Dual Stream (Twitch Embed + Kick Popout)',
      description: 'Chats de Twitch y Kick junto con una lista de eventos central.',
      columns: 3 as const,
      preview: ['Twitch Embed', 'Event List', 'Kick Popout'],
      generate: (): WidgetItem[] => [
        {
          id: `twitch-${Date.now()}`,
          title: `Twitch Chat (${channelName})`,
          platform: 'twitch',
          url: `https://www.twitch.tv/embed/${channelName}/chat?parent=${currentHost}&parent=samo2105.github.io&darkpopout`,
          columnSpan: 1,
          createdAt: Date.now(),
        },
        {
          id: `eventlist-${Date.now() + 1}`,
          title: 'Event List (Streamlabs / SE)',
          platform: 'eventlist',
          url: 'about:blank',
          columnSpan: 1,
          createdAt: Date.now() + 1,
        },
        {
          id: `kick-${Date.now() + 2}`,
          title: `Kick Chat (${channelName})`,
          platform: 'kick',
          url: `https://kick.com/popout/${channelName}/chat`,
          columnSpan: 1,
          createdAt: Date.now() + 2,
        },
      ],
    },
    {
      id: 'alerts-events',
      title: 'Centro de Alertas & Eventos Multi-Servicio',
      description: 'Dedicado a monitorear donaciones, suscripciones, follows y bits a través de múltiples fuentes de Event List.',
      columns: 2 as const,
      preview: ['Streamlabs Event List', 'StreamElements Activity Feed'],
      generate: (): WidgetItem[] => [
        {
          id: `sl-${Date.now()}`,
          title: 'Streamlabs Event List',
          platform: 'eventlist',
          url: 'about:blank',
          columnSpan: 1,
          createdAt: Date.now(),
        },
        {
          id: `se-${Date.now() + 1}`,
          title: 'StreamElements Activity Feed',
          platform: 'eventlist',
          url: 'about:blank',
          columnSpan: 1,
          createdAt: Date.now() + 1,
        },
      ],
    },
  ];

  const handleSelect = (preset: typeof presets[0]) => {
    const widgets = preset.generate();
    onApplyPreset(widgets, preset.columns);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Plantillas Rápidas de Panel</h2>
              <p className="text-xs text-zinc-400">Configura tu estación de stream en un clic</p>
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Username Input */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <label className="block text-xs font-semibold text-purple-200 mb-1">
              Tu nombre de usuario / canal común:
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="samo2105"
              className="w-full px-3 py-1.5 text-xs bg-zinc-950 border border-purple-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
            />
            <p className="text-[11px] text-purple-300/70 mt-1">
              Se usará para pre-rellenar los chats y URLs de Twitch y Kick automáticamente.
            </p>
          </div>

          {/* Presets List */}
          <div className="space-y-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-200 group-hover:text-purple-400 transition-colors">
                      {preset.title}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {preset.columns} columnas
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {preset.preview.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(preset)}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-800 hover:bg-purple-600 text-white rounded-lg transition-all"
                >
                  <span>Cargar Plantilla</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
