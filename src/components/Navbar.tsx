import React from 'react';
import { 
  Columns, 
  Plus, 
  Settings, 
  Sparkles, 
  Github, 
  Tv2,
  Radio,
  SunMoon
} from 'lucide-react';
import { GridColumns, ChannelsConfig } from '../types/widget';

interface NavbarProps {
  columns: GridColumns;
  onColumnsChange: (cols: GridColumns) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenProfileModal: () => void;
  channels: ChannelsConfig;
  totalWidgets: number;
  allHighContrast?: boolean;
  onToggleAllContrast?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  columns,
  onColumnsChange,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenPresetsModal,
  onOpenProfileModal,
  channels,
  totalWidgets,
  allHighContrast,
  onToggleAllContrast,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md px-4 py-3">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Live Status */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                StreamPulse
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Hub
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Actividad, alertas y chats multiplataforma
            </p>
          </div>
        </div>

        {/* Center / Layout Controls */}
        <div className="flex items-center gap-2">
          {/* Columns selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <span className="text-zinc-500 px-2 flex items-center gap-1 hidden md:flex">
              <Columns className="w-3.5 h-3.5" />
              Columnas:
            </span>
            {([1, 2, 3, 4] as GridColumns[]).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onColumnsChange(col)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  columns === col
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={`Ver en ${col} columna${col > 1 ? 's' : ''}`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Quick Presets button */}
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Plantillas
          </button>

          {/* Global High Contrast button */}
          {onToggleAllContrast && (
            <button
              type="button"
              onClick={onToggleAllContrast}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                allHighContrast
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'
              }`}
              title={
                allHighContrast
                  ? 'Alto Contraste Global: ACTIVADO en todos los widgets. Haz clic para desactivar.'
                  : 'Alto Contraste Global: Haz clic para activar en todos los widgets.'
              }
            >
              <SunMoon className={`w-3.5 h-3.5 ${allHighContrast ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className="hidden md:inline">Alto Contraste</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Configure Channels / Profile Button */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-purple-500/30 rounded-lg transition-all shadow-sm"
            title="Configurar nombres de usuario y canales de stream"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline text-zinc-400 font-normal">Canal:</span>
            <span className="text-purple-300 font-medium truncate max-w-[120px]">
              {channels.youtubeHandle ? `@${channels.youtubeHandle.replace(/^@/, '')}` : channels.twitch || 'Mis Canales'}
            </span>
          </button>

          {/* Add Widget Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Widget</span>
            {totalWidgets > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-800/80 text-[10px]">
                {totalWidgets}
              </span>
            )}
          </button>

          {/* Settings / Backup */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            title="Configuración y Copia de Seguridad"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/samo2105/stream-activity-dashboard"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
            title="Ver repositorio en GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
