import React from 'react';
import { Plus, Sparkles, LayoutGrid } from 'lucide-react';
import { WidgetItem, GridColumns } from '../types/widget';
import { WidgetCard } from './WidgetCard';

interface WidgetGridProps {
  widgets: WidgetItem[];
  columns: GridColumns;
  onDeleteWidget: (id: string) => void;
  onEditWidget: (widget: WidgetItem) => void;
  onToggleSpan: (id: string) => void;
  onToggleContrast: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenPresetsModal: () => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  columns,
  onDeleteWidget,
  onEditWidget,
  onToggleSpan,
  onToggleContrast,
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

  return (
    <div className={`grid gap-4 ${getGridColsClass()}`}>
      {widgets.map((widget) => (
        <WidgetCard
          key={widget.id}
          widget={widget}
          onDelete={onDeleteWidget}
          onEdit={onEditWidget}
          onToggleSpan={onToggleSpan}
          onToggleContrast={onToggleContrast}
        />
      ))}
    </div>
  );
};
