import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { DashboardConfig } from '../types/widget';
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
            <h2 className="text-base font-bold text-white">Configuración del Panel</h2>
            <p className="text-xs text-zinc-400">Respaldo, privacidad y gestión de datos</p>
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

          {/* Privacy & Security Card */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidad Total y Seguridad de Tokens</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tus URLs de eventos, tokens privados de Streamlabs/StreamElements y ajustes se guardan 
              <strong> únicamente en el almacenamiento local de este navegador (LocalStorage)</strong>. 
              Ningún token ni secreto se envía a servidores externos ni a GitHub.
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Copia de Seguridad y Restauración
            </h3>
            <p className="text-xs text-zinc-400">
              Exporta tu lista de widgets para usarla en otro navegador, computadora de stream, o para no perder tus URLs.
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
