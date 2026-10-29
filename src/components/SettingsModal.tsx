import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Check,
  Tv2,
  Sliders,
  Activity,
  Radio
} from 'lucide-react';
import { DashboardConfig, CounterSize } from '../types/widget';
import { exportConfigToFile, parseConfigFile } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onUpdateConfig: (newConfig: DashboardConfig) => void;
  onResetDefaults: () => void;
  onOpenHealthModal?: () => void;
  onOpenObsModal?: () => void;
  onOpenChannelsModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetDefaults,
  onOpenHealthModal,
  onOpenObsModal,
  onOpenChannelsModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
        setStatusMsg('Configuración importada y aplicada exitosamente.');
      } else {
        alert('El archivo JSON seleccionado no tiene un formato válido para StreamPulse.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            <h2 className="text-base font-bold text-white">Ajustes del Sistema y Respaldo</h2>
            <p className="text-xs text-zinc-400">Respaldo de widgets, diagnósticos y privacidad local</p>
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

          {/* Quick link to Channels Modal */}
          {onOpenChannelsModal && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Canales de Transmisión</span>
                  <span className="text-[11px] text-zinc-400 block">Gestiona tus cuentas de Twitch, Kick, YouTube, TikTok y Facebook</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChannelsModal();
                }}
                className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
              >
                Abrir Canales
              </button>
            </div>
          )}

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

          {/* Global Frame Font Scale / Zoom Setting */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                Escala Global de Fuente en Frames
              </span>
              <span className="text-purple-400 font-mono font-bold text-xs">
                {Math.round((config.globalFontScale || 1.0) * 100)}%
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Ajusta el tamaño base de la fuente y contenido para todos los widgets embebidos (chats y alertas).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { scale: 0.85, label: '85%', desc: 'Compacto' },
                { scale: 1.0, label: '100%', desc: 'Normal' },
                { scale: 1.15, label: '115%', desc: 'Medio' },
                { scale: 1.3, label: '130%', desc: 'Grande' },
                { scale: 1.5, label: '150%', desc: 'Gigante' },
              ].map(({ scale, label, desc }) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => {
                    onUpdateConfig({ ...config, globalFontScale: scale });
                    setStatusMsg(`Escala global de frames configurada a ${label}.`);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    (config.globalFontScale || 1.0) === scale
                      ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/40 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{label}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OBS Studio Integration Action Card */}
          {onOpenObsModal && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-0.5">
                  <Tv2 className="w-4 h-4 text-purple-400" />
                  Conexión OBS Studio (WebSocket v5)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Controla la emisión, graba y monitorea cuadros perdidos (dropped frames) directamente en tiempo real.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenObsModal}
                className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
              >
                Abrir Panel OBS
              </button>
            </div>
          )}

          {/* Stream Health Diagnostic Action */}
          {onOpenHealthModal && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-0.5">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Diagnóstico de Red y Salud del Stream
                </span>
                <p className="text-[11px] text-zinc-400">
                  Prueba la latencia, jitter y respuesta individual de YouTube, Twitch, Kick y Streamlabs.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenHealthModal}
                className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
              >
                Abrir Test
              </button>
            </div>
          )}

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
