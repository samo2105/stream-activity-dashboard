import { WidgetPlatform, WidgetItem } from '../types/widget';

export interface PlatformPreset {
  platform: WidgetPlatform;
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  placeholderUrl: string;
  guideText: string;
  defaultTitle: string;
}

export const PLATFORM_PRESETS: Record<WidgetPlatform, PlatformPreset> = {
  streamlabs: {
    platform: 'streamlabs',
    name: 'Streamlabs (Eventos / Alertas)',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeText: 'Streamlabs',
    borderColor: 'border-emerald-500/40',
    placeholderUrl: 'https://streamlabs.com/widgets/event-list/v1/TU_TOKEN_AQUI',
    guideText: 'Ve a tu Streamlabs Dashboard -> Widgets -> Event List (Lista de Eventos) -> Copia la "URL de la fuente del navegador".',
    defaultTitle: 'Streamlabs Event List',
  },
  streamelements: {
    platform: 'streamelements',
    name: 'StreamElements (Activity Feed)',
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeText: 'StreamElements',
    borderColor: 'border-blue-500/40',
    placeholderUrl: 'https://streamelements.com/overlay/TU_OVERLAY_ID/activity-feed',
    guideText: 'Ve a StreamElements -> Herramientas de streaming -> Overlays o Activity Feed -> Copia la URL de la superposición.',
    defaultTitle: 'StreamElements Feed',
  },
  twitch: {
    platform: 'twitch',
    name: 'Twitch (Chat Popout)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'Twitch',
    borderColor: 'border-purple-500/40',
    placeholderUrl: 'https://www.twitch.tv/popout/TU_CANAL/chat?darkpopout',
    guideText: 'Escribe tu nombre de usuario de Twitch. Se generará la URL popout optimizada en modo oscuro con tu dominio.',
    defaultTitle: 'Twitch Chat',
  },
  kick: {
    platform: 'kick',
    name: 'Kick (Chat Popout)',
    badgeBg: 'bg-green-500/20 text-green-400 border-green-500/30',
    badgeText: 'Kick',
    borderColor: 'border-green-500/40',
    placeholderUrl: 'https://kick.com/popout/TU_CANAL/chat',
    guideText: 'Escribe tu nombre de usuario de Kick. Se generará la ventana emergente oficial del chat.',
    defaultTitle: 'Kick Chat',
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube Live (Chat)',
    badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    badgeText: 'YouTube',
    borderColor: 'border-red-500/40',
    placeholderUrl: 'https://www.youtube.com/live_chat?v=ID_VIDEO&embed_domain=DOMINIO',
    guideText: 'Introduce el ID de tu transmisión en vivo de YouTube (el parámetro "v" de la URL del stream).',
    defaultTitle: 'YouTube Live Chat',
  },
  botrix: {
    platform: 'botrix',
    name: 'BotRix (Widgets / Alertas)',
    badgeBg: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    badgeText: 'BotRix',
    borderColor: 'border-violet-500/40',
    placeholderUrl: 'https://botrix.live/widgets/TU_WIDGET_ID',
    guideText: 'Copia la URL del widget o alerta creada en BotRix para Kick/Twitch/YouTube.',
    defaultTitle: 'BotRix Widgets',
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok Live (Web Fuente)',
    badgeBg: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    badgeText: 'TikTok',
    borderColor: 'border-pink-500/40',
    placeholderUrl: 'https://tikfinity.zerody.one/widget/...',
    guideText: 'Utiliza la URL de widget de eventos generada por TikFinity u otra herramienta de navegador para TikTok Live.',
    defaultTitle: 'TikTok Live Feed',
  },
  custom: {
    platform: 'custom',
    name: 'URL Personalizada / OBS Browser Source',
    badgeBg: 'bg-zinc-700/40 text-zinc-300 border-zinc-600',
    badgeText: 'Custom Web',
    borderColor: 'border-zinc-700',
    placeholderUrl: 'https://...',
    guideText: 'Pega cualquier URL HTTPS de un widget de navegador, contador de metas, alertas o página web compatible.',
    defaultTitle: 'Widget Personalizado',
  },
};

export const INITIAL_DEFAULT_WIDGETS: WidgetItem[] = [
  {
    id: 'demo-1',
    title: 'Twitch Chat (Demo)',
    platform: 'twitch',
    url: 'https://www.twitch.tv/popout/samo2105/chat?darkpopout',
    columnSpan: 1,
    createdAt: Date.now() - 3000,
  },
  {
    id: 'demo-2',
    title: 'Streamlabs Event List (Guía)',
    platform: 'streamlabs',
    url: 'about:blank',
    columnSpan: 1,
    createdAt: Date.now() - 2000,
  },
  {
    id: 'demo-3',
    title: 'Kick Chat (Demo)',
    platform: 'kick',
    url: 'https://kick.com/popout/samo2105/chat',
    columnSpan: 1,
    createdAt: Date.now() - 1000,
  },
];
