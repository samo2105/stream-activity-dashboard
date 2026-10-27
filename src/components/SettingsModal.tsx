import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Check,
  Tv2,
  Sliders
} from 'lucide-react';
import { DashboardConfig, ChannelsConfig, CounterSize } from '../types/widget';
import { exportConfigToFile, parseConfigFile } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onUpdateConfig: (newConfig: DashboardConfig) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelsConfig>(config.channels || { twitch: '', kick: '', youtube: '' });

  if (!isOpen) return null;

  const handleExport = () => {
    exportConfigToFile(config);
    setStatusMsg('Copia de seguridad descargada exitosamente en formato JSON.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseConfigFile(content);
      if (parsed) {
        onUpdateConfig(parsed);
        setChannels(parsed.channels);
        setStatusMsg('Configuración importada y aplicada exitosamente.');
      } else {
        alert('El archivo JSON seleccionado no tiene un formato válido para StreamPulse.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveChannels = () => {
    onUpdateConfig({
      ...config,
      channels,
    });
    setStatusMsg('Canales para el conteo de viewers guardados.');
  };

  const handleReset = () => {
    if (window.confirm('¿Seguro que deseas restaurar la configuración inicial? Se reemplazarán los widgets actuales.')) {
      onResetDefaults();
      setStatusMsg('Configuración restaurada a los valores predeterminados.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div>
            <h2 className="text-base font-bold text-white">Configuración del Panel</h2>
            <p className="text-xs text-zinc-400">Canales de viewers, respaldo y privacidad</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Channels Configuration for Viewer Counter */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tv2 className="w-4 h-4 text-purple-400" />
              Canales para Conteo de Viewers
            </h3>
            <p className="text-xs text-zinc-400">
              Ingresa los nombres de tus canales para mostrar los espectadores en vivo de cada plataforma en la barra superior.
            </p>

            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-purple-300 mb-1">
                  Usuario de Twitch:
                </label>
                <input
                  type="text"
                  placeholder="ej. samo2105"
                  value={channels.twitch}
                  onChange={(e) => setChannels({ ...channels, twitch: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-green-300 mb-1">
                  Usuario de Kick:
                </label>
                <input
                  type="text"
                  placeholder="ej. samo2105"
                  value={channels.kick}
                  onChange={(e) => setChannels({ ...channels, kick: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-red-300 mb-1">
                  ID de Video o Stream de YouTube:
                </label>
                <input
                  type="text"
                  placeholder="ej. dQw4w9WgXcQ"
                  value={channels.youtube}
                  onChange={(e) => setChannels({ ...channels, youtube: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveChannels}
                className="mt-1 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Guardar Canales
              </button>
            </div>
          </div>

          {/* Viewer Counters Sizing Setting */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              Tamaño de Conteos de Viewers
            </h3>
            <p className="text-xs text-zinc-400">
              Personaliza el tamaño de los números y chips de espectadores en la barra superior.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { size: 'sm', label: 'Pequeño', desc: 'Compacto (S)' },
                { size: 'md', label: 'Normal', desc: 'Estándar (M)' },
                { size: 'lg', label: 'Grande', desc: 'Destacado (L)' },
                { size: 'xl', label: 'Extra Grande', desc: 'Para stream (XL)' },
              ].map(({ size, label, desc }) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onUpdateConfig({ ...config, counterSize: size as CounterSize });
                    setStatusMsg(`Tamaño de conteos actualizado a ${label} (${size.toUpperCase()}).`);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    (config.counterSize || 'md') === size
                      ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/40 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{label}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Security Card */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidad Total y Seguridad de Tokens</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tus URLs de eventos, tokens privados de Streamlabs/StreamElements y canales se guardan 
              <strong> únicamente en el almacenamiento local de este navegador (LocalStorage)</strong>. 
              Ningún secreto se envía a servidores externos ni a GitHub.
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Copia de Seguridad y Restauración
            </h3>
            <p className="text-xs text-zinc-400">
              Exporta tu lista de widgets y canales para usarla en otro navegador o PC de stream.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Exportar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Importar JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset Defaults */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Restaurar Valores Iniciales
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Vuelve al conjunto de widgets de muestra originales.
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
