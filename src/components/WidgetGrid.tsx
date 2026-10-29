import React from 'react';
import { Plus, Sparkles, LayoutGrid, Columns, Layers } from 'lucide-react';
import { WidgetItem, GridColumns, ThemeMode, ViewerStats } from '../types/widget';
import { isWidgetStreamActive } from '../utils/streamHealth';
import { WidgetCard } from './WidgetCard';

interface WidgetGridProps {
  widgets: WidgetItem[];
  columns: GridColumns;
  onColumnsChange?: (cols: GridColumns) => void;
  dashboardTheme?: ThemeMode;
  dashboardFontScale?: number;
  viewerStats?: ViewerStats | null;
  obsStreamingActive?: boolean;
  onDeleteWidget: (id: string) => void;
  onEditWidget: (widget: WidgetItem) => void;
  onToggleSpan: (id: string) => void;
  onCycleTheme: (id: string) => void;
  onUpdateFontScale?: (id: string, scale: number) => void;
  onOpenAddModal: () => void;
  onOpenPresetsModal: () => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  columns,
  onColumnsChange,
  dashboardTheme,
  dashboardFontScale,
  viewerStats,
  obsStreamingActive,
  onDeleteWidget,
  onEditWidget,
  onToggleSpan,
  onCycleTheme,
  onUpdateFontScale,
  onOpenAddModal,
  onOpenPresetsModal,
}) => {
  if (widgets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-4 shadow-xl">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          Tu panel de stream está vacío
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          Comienza añadiendo los eventos o chats de tus plataformas (Twitch, Kick, YouTube, Streamlabs o BotRix).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Primer Widget</span>
          </button>
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Cargar una Plantilla Rápida</span>
          </button>
        </div>
      </div>
    );
  }

  const getGridColsClass = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-3';
    }
  };

  const isLight = dashboardTheme === 'light';

  return (
    <div className="space-y-4">
      {/* Grid Toolbar / Header - Only Chips & Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/25">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Widget Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Widget</span>
          </button>

          {/* Quick Presets button */}
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-200'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantillas</span>
          </button>

          {/* Columns Selector */}
          {onColumnsChange && (
            <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <span className={`px-2 flex items-center gap-1 text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <Columns className="w-3.5 h-3.5" />
                Columnas:
              </span>
              {([1, 2, 3, 4] as GridColumns[]).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onColumnsChange(col)}
                  className={`px-2.5 py-0.5 rounded font-medium transition-all ${
                    columns === col
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={`Ver en ${col} columna${col > 1 ? 's' : ''}`}
                >
                  {col}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Widgets Grid Matrix */}
      <div className={`grid gap-4 ${getGridColsClass()}`}>
        {widgets.map((widget) => {
          const isLive = isWidgetStreamActive(
            widget.platform,
            widget.url,
            viewerStats,
            obsStreamingActive
          );
          return (
            <WidgetCard
              key={widget.id}
              widget={widget}
              dashboardTheme={dashboardTheme}
              dashboardFontScale={dashboardFontScale}
              isStreamActive={isLive}
              onDelete={onDeleteWidget}
              onEdit={onEditWidget}
              onToggleSpan={onToggleSpan}
              onCycleTheme={onCycleTheme}
              onUpdateFontScale={onUpdateFontScale}
            />
          );
        })}
      </div>
    </div>
  );
};
