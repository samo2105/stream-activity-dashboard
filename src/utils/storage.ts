import { DashboardConfig } from '../types/widget';
import { INITIAL_DEFAULT_WIDGETS } from './presets';

const STORAGE_KEY = 'streampulse_dashboard_config_v2';

export const DEFAULT_CONFIG: DashboardConfig = {
  columns: 3,
  autoRefreshInterval: 0,
  channels: {
    twitch: 'samo2105',
    kick: 'samo2105',
    youtube: '',
  },
  widgets: INITIAL_DEFAULT_WIDGETS,
};

export function loadDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy v1 key if migrating
      const legacy = localStorage.getItem('streampulse_dashboard_config_v1');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return {
          columns: parsedLegacy.columns || 3,
          autoRefreshInterval: parsedLegacy.autoRefreshInterval || 0,
          channels: DEFAULT_CONFIG.channels,
          widgets: Array.isArray(parsedLegacy.widgets) ? parsedLegacy.widgets : DEFAULT_CONFIG.widgets,
        };
      }
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      columns: parsed.columns || 3,
      autoRefreshInterval: parsed.autoRefreshInterval || 0,
      channels: {
        twitch: parsed.channels?.twitch ?? DEFAULT_CONFIG.channels.twitch,
        kick: parsed.channels?.kick ?? DEFAULT_CONFIG.channels.kick,
        youtube: parsed.channels?.youtube ?? DEFAULT_CONFIG.channels.youtube,
      },
      widgets: Array.isArray(parsed.widgets) ? parsed.widgets : DEFAULT_CONFIG.widgets,
    };
  } catch (error) {
    console.error('Error al cargar la configuración de localStorage:', error);
    return DEFAULT_CONFIG;
  }
}

export function saveDashboardConfig(config: DashboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

export function exportConfigToFile(config: DashboardConfig): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streampulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseConfigFile(jsonString: string): DashboardConfig | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.widgets)) {
      return {
        columns: [1, 2, 3, 4].includes(data.columns) ? data.columns : 3,
        autoRefreshInterval: typeof data.autoRefreshInterval === 'number' ? data.autoRefreshInterval : 0,
        channels: {
          twitch: data.channels?.twitch || '',
          kick: data.channels?.kick || '',
          youtube: data.channels?.youtube || '',
        },
        widgets: data.widgets,
      };
    }
  } catch (e) {
    console.error('Archivo de configuración inválido:', e);
  }
  return null;
}
