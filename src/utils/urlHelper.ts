import { WidgetPlatform } from '../types/widget';

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
 * Sanitizes and formats stream URLs for each platform so they load properly inside iframes
 * without triggering X-Frame-Options or CSP blocking.
 */
export function sanitizeStreamUrl(rawUrl: string, platform: WidgetPlatform): string {
  const url = extractCleanUrl(rawUrl);
  if (!url || url === 'about:blank') return 'about:blank';

  const currentHost = typeof window !== 'undefined' && window.location.hostname 
    ? window.location.hostname 
    : 'localhost';

  // 1. TWITCH DEBUGGING & FORMATTING
  if (platform === 'twitch' || url.includes('twitch.tv')) {
    // Check if user provided a popout or raw channel URL instead of embed
    // e.g., https://www.twitch.tv/popout/channel/chat -> converts to embed with parent
    let channel = '';
    const popoutMatch = url.match(/twitch\.tv\/popout\/([a-zA-Z0-9_]+)/i);
    const standardMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)(?:\/chat)?$/i);
    const embedMatch = url.match(/twitch\.tv\/embed\/([a-zA-Z0-9_]+)/i);

    if (embedMatch && embedMatch[1]) {
      channel = embedMatch[1];
    } else if (popoutMatch && popoutMatch[1]) {
      channel = popoutMatch[1];
    } else if (standardMatch && standardMatch[1]) {
      channel = standardMatch[1];
    }

    if (channel && channel.toLowerCase() !== 'embed' && channel.toLowerCase() !== 'popout') {
      // Build the authorized Twitch embed chat URL with parent domains
      const parents = Array.from(new Set([currentHost, 'samo2105.github.io', 'localhost', '127.0.0.1']));
      const parentParams = parents.map((p) => `parent=${encodeURIComponent(p)}`).join('&');
      return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${parentParams}&darkpopout`;
    }

    // If it's already an embed URL, ensure the currentHost is included in parent
    if (url.includes('/embed/') && !url.includes(`parent=${currentHost}`)) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}parent=${encodeURIComponent(currentHost)}&parent=samo2105.github.io`;
    }

    return url;
  }

  // 2. KICK DEBUGGING & FORMATTING
  if (platform === 'kick' || url.includes('kick.com')) {
    // If user provided raw channel URL e.g. https://kick.com/channel
    const channelMatch = url.match(/kick\.com\/([a-zA-Z0-9_]+)\/?$/i);
    if (channelMatch && channelMatch[1] && !['popout', 'video', 'categories'].includes(channelMatch[1].toLowerCase())) {
      return `https://kick.com/popout/${encodeURIComponent(channelMatch[1])}/chat`;
    }
    return url;
  }

  // 3. YOUTUBE DEBUGGING & FORMATTING
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    // Extract video ID if present
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('live/')) {
      videoId = url.split('live/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return `https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${encodeURIComponent(currentHost)}`;
    }
    return url;
  }

  return url;
}
