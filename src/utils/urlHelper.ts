import type { WidgetPlatform } from '../types/widget';

/**
 * Extracts a clean URL from user input, even if they pasted an entire <iframe> HTML snippet,
 * markdown link, or URL with extra whitespace.
 */
export function extractCleanUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed === 'about:blank') return trimmed;

  // If user pasted an iframe tag: <iframe src="https://..." ...>
  const iframeMatch = trimmed.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1].trim();
  }

  // If user pasted markdown [title](https://...)
  const mdMatch = trimmed.match(/\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1].trim();
  }

  // Extract raw URL if surrounded by quotes or tags
  const urlMatch = trimmed.match(/https?:\/\/[^\s"'>]+/i);
  if (urlMatch && urlMatch[0]) {
    return urlMatch[0].trim();
  }

  return trimmed;
}

/**
 * Checks if a pasted URL is an internal admin/dashboard URL instead of the public widget URL.
 */
export function validateWidgetUrl(url: string): { isValid: boolean; warning?: string } {
  const clean = extractCleanUrl(url);
  if (!clean || clean === 'about:blank') return { isValid: true };

  // Streamlabs dashboard mistake
  if (clean.includes('streamlabs.com/dashboard')) {
    return {
      isValid: false,
      warning: 'Has pegado el enlace del panel de administración (dashboard) de Streamlabs. Debes copiar la "URL de la fuente del navegador" (que empieza por streamlabs.com/widgets/... o streamlabs.com/alert-box/v3/...).',
    };
  }

  // BotRix panel mistake
  if (clean.includes('botrix.live/panel')) {
    return {
      isValid: false,
      warning: 'Has pegado el enlace de administración de BotRix. Debes copiar la "URL de la fuente del navegador" que empieza por botrix.live/widgets/...',
    };
  }

  // StreamElements dashboard mistake
  if (clean.includes('streamelements.com/dashboard')) {
    return {
      isValid: false,
      warning: 'Has pegado el panel de StreamElements. Ve a Mis Overlays -> Menú de 3 puntos -> "Copiar URL del Overlay".',
    };
  }

  // Facebook Live Producer / Creator Studio mistake
  if (clean.includes('facebook.com/live/producer') || clean.includes('facebook.com/creatorstudio')) {
    return {
      isValid: false,
      warning: 'Has pegado el enlace del Live Producer o Creator Studio de Facebook. Debes usar la URL pública del stream o página (ej. https://facebook.com/TuPagina/live).',
    };
  }

  // TikTok Live Studio / Creator Center mistake
  if (clean.includes('tiktok.com/live/creator') || clean.includes('tiktok.com/studio') || clean.includes('tiktok.com/creator-center')) {
    return {
      isValid: false,
      warning: 'Has pegado el enlace del TikTok Live Studio o panel de creador. Debes usar la URL pública del stream (ej. https://www.tiktok.com/@usuario/live) o tu widget de TikFinity/BotRix.',
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes and formats stream URLs for each platform so they load properly inside iframes
 * without triggering X-Frame-Options or CSP blocking.
 */
export function sanitizeStreamUrl(rawUrl: string, platform: WidgetPlatform): string {
  const url = extractCleanUrl(rawUrl);
  if (!url || url === 'about:blank') return 'about:blank';

  const currentHost = typeof window !== 'undefined' && window.location.hostname 
    ? window.location.hostname 
    : 'localhost';

  // 0. STREAMLABS TOKEN AUTO-FORMATTING
  if (platform === 'streamlabs' || platform === 'chatbox' || platform === 'eventlist') {
    const trimmed = url.trim();
    if (/^[A-Fa-f0-9]{60,}$/.test(trimmed)) {
      if (platform === 'chatbox') {
        return `https://streamlabs.com/widgets/chat-box/v1/${trimmed}`;
      }
      return `https://streamlabs.com/widgets/event-list/v1/${trimmed}`;
    }
  }

  // 1. TWITCH DEBUGGING & FORMATTING
  if (platform === 'twitch' || url.includes('twitch.tv')) {
    let channel = '';
    const popoutMatch = url.match(/twitch\.tv\/popout\/@?([a-zA-Z0-9_]+)/i);
    const standardMatch = url.match(/twitch\.tv\/@?([a-zA-Z0-9_]+)(?:\/chat)?$/i);
    const embedMatch = url.match(/twitch\.tv\/embed\/@?([a-zA-Z0-9_]+)/i);

    if (embedMatch && embedMatch[1]) {
      channel = embedMatch[1];
    } else if (popoutMatch && popoutMatch[1]) {
      channel = popoutMatch[1];
    } else if (standardMatch && standardMatch[1]) {
      channel = standardMatch[1];
    }

    if (channel && channel.toLowerCase() !== 'embed' && channel.toLowerCase() !== 'popout') {
      const cleanChan = channel.replace(/^@/, '');
      const parents = Array.from(new Set([currentHost, 'samo2105.github.io', 'localhost', '127.0.0.1']));
      const parentParams = parents.map((p) => `parent=${encodeURIComponent(p)}`).join('&');
      return `https://www.twitch.tv/embed/${encodeURIComponent(cleanChan)}/chat?${parentParams}&darkpopout`;
    }

    if (url.includes('/embed/') && !url.includes(`parent=${currentHost}`)) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}parent=${encodeURIComponent(currentHost)}&parent=samo2105.github.io`;
    }

    return url;
  }

  // 2. KICK DEBUGGING & FORMATTING
  if (platform === 'kick' || url.includes('kick.com')) {
    // Check if user provided channel with or without @
    const popoutMatch = url.match(/kick\.com\/popout\/@?([a-zA-Z0-9_]+)/i);
    const channelMatch = url.match(/kick\.com\/@?([a-zA-Z0-9_]+)\/?$/i);

    if (popoutMatch && popoutMatch[1]) {
      const cleanChan = popoutMatch[1].replace(/^@/, '');
      return `https://kick.com/popout/${encodeURIComponent(cleanChan)}/chat`;
    }

    if (channelMatch && channelMatch[1] && !['popout', 'video', 'categories'].includes(channelMatch[1].toLowerCase())) {
      const cleanChan = channelMatch[1].replace(/^@/, '');
      return `https://kick.com/popout/${encodeURIComponent(cleanChan)}/chat`;
    }
    return url;
  }

  // 3. YOUTUBE DEBUGGING & FORMATTING
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('live/')) {
      videoId = url.split('live/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return `https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${encodeURIComponent(currentHost)}&dark_theme=1`;
    }

    // If it's already a live_chat URL, ensure embed_domain and dark_theme=1 are present
    if (url.includes('/live_chat')) {
      let finalUrl = url;
      if (!finalUrl.includes('embed_domain=')) {
        finalUrl += `${finalUrl.includes('?') ? '&' : '?'}embed_domain=${encodeURIComponent(currentHost)}`;
      }
      if (!finalUrl.includes('dark_theme=1')) {
        finalUrl += '&dark_theme=1';
      }
      return finalUrl;
    }

    return url;
  }

  // 4. FACEBOOK LIVE EMBED FORMATTING
  if (platform === 'facebook' || url.includes('facebook.com') || url.includes('fb.gg') || url.includes('fb.watch')) {
    // If it's already an official Facebook plugin iframe URL, preserve it
    if (url.includes('/plugins/video.php') || url.includes('/plugins/comments.php')) {
      return url;
    }

    let fullUrl = url;
    // If user provided raw username/page without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const cleanChan = url.replace(/^@/, '');
      fullUrl = `https://www.facebook.com/${cleanChan}/live`;
    }

    // If chat / comments is explicitly intended
    if (url.includes('/comments') || url.includes('type=comments')) {
      return `https://www.facebook.com/plugins/comments.php?href=${encodeURIComponent(fullUrl)}&numposts=15&width=100%25`;
    }

    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fullUrl)}&show_text=false&autoplay=true`;
  }

  // 5. TIKTOK LIVE EMBED & WEB FORMATTING
  if (platform === 'tiktok' || url.includes('tiktok.com')) {
    // If it's already a TikFinity or external browser widget URL, keep it
    if (url.includes('tikfinity') || url.includes('botrix.live')) {
      return url;
    }

    let fullUrl = url;
    // If user provided raw username without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const cleanUser = url.replace(/^@/, '');
      fullUrl = `https://www.tiktok.com/@${cleanUser}/live`;
    }

    return fullUrl;
  }

  return url;
}

/**
 * Generates an iframe-ready embed URL for Facebook Live (either official video player or comments/chat).
 */
export function generateFacebookEmbedUrl(input: string, mode: 'player' | 'chat' = 'player'): string {
  const clean = extractCleanUrl(input).trim();
  if (!clean) return '';

  let fullUrl = clean;
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    const cleanChan = clean.replace(/^@/, '');
    fullUrl = `https://www.facebook.com/${cleanChan}/live`;
  }

  if (mode === 'chat') {
    return `https://www.facebook.com/plugins/comments.php?href=${encodeURIComponent(fullUrl)}&numposts=15&width=100%25`;
  }
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fullUrl)}&show_text=false&autoplay=true`;
}

/**
 * Generates an iframe-ready embed URL for TikTok LIVE (Modo B direct live stream or third-party chat overlay).
 */
export function generateTikTokEmbedUrl(input: string, mode: 'player' | 'chat' = 'player'): string {
  const clean = extractCleanUrl(input).trim();
  if (!clean) return '';

  // If user provided a TikFinity or external widget URL, preserve it
  if (clean.includes('tikfinity') || clean.includes('botrix.live')) {
    return clean;
  }

  // Extract clean username
  const username = clean
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/\/live\/?.*$/i, '')
    .replace(/\/.*$/i, '')
    .replace(/^@+/, '')
    .trim();

  if (!username) return '';

  const baseLiveUrl = `https://www.tiktok.com/@${username}/live`;
  return mode === 'chat' ? `${baseLiveUrl}#chat` : baseLiveUrl;
}

/**
 * Generates official embed player URL for Twitch Live stream.
 */
export function generateTwitchPlayerEmbedUrl(channel: string, muted: boolean = true, hostOverride?: string): string {
  const clean = extractCleanUrl(channel)
    .replace(/^https?:\/\/(www\.)?twitch\.tv\/?/i, '')
    .replace(/\/.*$/, '')
    .replace(/^@+/, '')
    .trim();
  if (!clean) return '';

  const host = hostOverride || (typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost');
  return `https://player.twitch.tv/?channel=${encodeURIComponent(clean)}&parent=${encodeURIComponent(host)}&parent=samo2105.github.io&muted=${muted}&autoplay=true`;
}

/**
 * Generates official embed player URL for YouTube Live stream.
 */
export function generateYouTubePlayerEmbedUrl(videoIdOrUrl: string, muted: boolean = true): string {
  const clean = extractCleanUrl(videoIdOrUrl).trim();
  if (!clean) return '';

  let videoId = clean;
  if (clean.includes('v=')) {
    videoId = clean.split('v=')[1]?.split('&')[0] || clean;
  } else if (clean.includes('youtu.be/')) {
    videoId = clean.split('youtu.be/')[1]?.split('?')[0] || clean;
  } else if (clean.includes('live/')) {
    videoId = clean.split('live/')[1]?.split('?')[0] || clean;
  } else if (clean.includes('embed/')) {
    videoId = clean.split('embed/')[1]?.split('?')[0] || clean;
  } else {
    videoId = clean.replace(/^@+/, '');
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0`;
}

/**
 * Generates official embed player URL for Kick Live stream.
 */
export function generateKickPlayerEmbedUrl(channel: string, muted: boolean = true): string {
  const clean = extractCleanUrl(channel)
    .replace(/^https?:\/\/(www\.)?kick\.com\/?/i, '')
    .replace(/\/.*$/, '')
    .replace(/^@+/, '')
    .trim();
  if (!clean) return '';

  return `https://player.kick.com/${encodeURIComponent(clean)}?autoplay=true&muted=${muted}`;
}

/**
 * Generates official embed video player URL for Facebook Live stream.
 */
export function generateFacebookPlayerEmbedUrl(urlOrChannel: string, muted: boolean = true): string {
  const clean = extractCleanUrl(urlOrChannel).trim();
  if (!clean) return '';

  let fullUrl = clean;
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    const cleanChan = clean.replace(/^@/, '');
    fullUrl = `https://www.facebook.com/${cleanChan}/live`;
  }

  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fullUrl)}&show_text=false&autoplay=true&mute=${muted ? 1 : 0}`;
}

/**
 * Generates official responsive player URL for TikTok LIVE stream.
 */
export function generateTikTokPlayerEmbedUrl(channelOrUrl: string): string {
  const clean = extractCleanUrl(channelOrUrl).trim();
  if (!clean) return '';

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const username = clean.replace(/^@+/, '').trim();
  if (!username) return '';

  return `https://www.tiktok.com/@${encodeURIComponent(username)}/live`;
}
