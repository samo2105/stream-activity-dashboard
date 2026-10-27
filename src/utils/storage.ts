import { DashboardConfig, WidgetItem } from '../types/widget';
import { INITIAL_DEFAULT_WIDGETS } from './presets';

const STORAGE_KEY = 'streampulse_dashboard_config_v3';

export const DEFAULT_CONFIG: DashboardConfig = {
  columns: 3,
  autoRefreshInterval: 0,
  channels: {
    twitch: 'samo2105',
    kick: '',
    youtube: '',
  },
  widgets: INITIAL_DEFAULT_WIDGETS,
};

export function loadDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy v1 or v2 keys to migrate
      const legacy = localStorage.getItem('streampulse_dashboard_config_v2') || localStorage.getItem('streampulse_dashboard_config_v1');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return {
          columns: parsedLegacy.columns || 3,
          autoRefreshInterval: parsedLegacy.autoRefreshInterval || 0,
          channels: {
            twitch: parsedLegacy.channels?.twitch || 'samo2105',
            kick: parsedLegacy.channels?.kick || '',
            youtube: parsedLegacy.channels?.youtube || '',
          },
          widgets: Array.isArray(parsedLegacy.widgets)
            ? parsedLegacy.widgets.map((w: WidgetItem) => {
                if (w.url?.includes('kick.com/popout/samo2105/chat')) {
                  return { ...w, url: 'about:blank' };
                }
                if (w.platform === 'chatbox' && (w.url === 'about:blank' || !w.url)) {
                  return { ...w, url: DEFAULT_CONFIG.widgets[0].url };
                }
                return w;
              })
            : DEFAULT_CONFIG.widgets,
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
      widgets: Array.isArray(parsed.widgets) 
        ? parsed.widgets.map((w: WidgetItem) => {
            // Fix broken 404 kick demo
            if (w.url?.includes('kick.com/popout/samo2105/chat')) {
              return { ...w, url: 'about:blank' };
            }
            // Automatically upgrade legacy broken popout URLs to embed
            if (w.url?.includes('twitch.tv/popout/')) {
              return {
                ...w,
                url: w.url.replace('/popout/', '/embed/').concat('&parent=samo2105.github.io'),
              };
            }
            return w;
          })
        : DEFAULT_CONFIG.widgets,
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
