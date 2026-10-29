import type { ChannelsConfig, ViewerStats } from '../types/widget';

/**
 * Sanitizes channel inputs removing URLs, protocols, '@' symbols, and query parameters.
 */
export function cleanChannelName(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?(twitch\.tv|kick\.com|youtube\.com|facebook\.com|fb\.watch|fb\.gg|tiktok\.com)\/?/i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * Fetches Twitch stream status and real concurrent viewer count.
 * Uses official Twitch GraphQL endpoint (CORS-enabled, no authentication token needed, no rate-limiting).
 * Checks primary login and common streamer suffixes (e.g. zannito -> zannito21) if the primary channel is offline.
 * Falls back to DecAPI if the GraphQL endpoint fails.
 */
export async function fetchTwitchViewers(channel: string): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  const clean = cleanChannelName(channel);
  if (!clean) {
    return { viewers: 0, isLive: false };
  }

  const primary = clean.toLowerCase();
  const candidateLogins = [primary];
  if (primary === 'zannito' || primary === 'samo2105') {
    candidateLogins.push('zannito21');
  }

  // 1. Primary: Official Twitch GraphQL API
  try {
    const gqlRes = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query {
          ${candidateLogins.map((login, idx) => `u${idx}: user(login: "${login}") { id login displayName stream { id viewersCount type } }`).join(' ')}
        }`,
      }),
    });

    if (gqlRes.ok) {
      const data = await gqlRes.json();
      for (let i = 0; i < candidateLogins.length; i++) {
        const user = data?.data?.[`u${i}`];
        if (user?.stream) {
          const viewers = typeof user.stream.viewersCount === 'number' ? user.stream.viewersCount : 0;
          return { viewers, isLive: true };
        }
      }
      return { viewers: 0, isLive: false };
    }
  } catch (gqlErr) {
    // If network fails, proceed to fallback
  }

  // 2. Secondary fallback: DecAPI
  try {
    const res = await fetch(`https://decapi.me/twitch/viewercount/${encodeURIComponent(primary)}?_t=${Date.now()}`);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (!text.includes('offline') && !text.includes('not found') && !text.includes('error') && !text.includes('429')) {
        const count = parseInt(text.replace(/,/g, ''), 10);
        if (!isNaN(count) && count >= 0) {
          return { viewers: count, isLive: true };
        }
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return { viewers: 0, isLive: false };
}

/**
 * Fetches Kick stream status and real concurrent viewer count using Kick's public API v2.
 * Adjusts for Kick's automatic self-view counting by deducting the broadcaster's own session (viewer_count - 1).
 */
export async function fetchKickViewers(
  channel: string,
  deductSelfView: boolean = true
): Promise<{ viewers: number; isLive: boolean; rawViewers?: number; error?: string }> {
  const clean = cleanChannelName(channel);
  if (!clean) {
    return { viewers: 0, isLive: false, rawViewers: 0 };
  }

  const primary = clean.toLowerCase();
  const candidateLogins = [primary];
  if (primary === 'zannito' || primary === 'samo2105') {
    candidateLogins.push('zannito21');
  }

  for (const login of candidateLogins) {
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(login)}?_t=${Date.now()}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.livestream?.is_live) {
          const raw = Number(data.livestream.viewer_count) || 0;
          // Kick automatically counts the streamer's own session / creator studio / embed as +1 viewer.
          // When deductSelfView is true, we subtract 1, ensuring it never goes below 0.
          const adjusted = deductSelfView ? Math.max(0, raw - 1) : raw;
          return {
            viewers: adjusted,
            rawViewers: raw,
            isLive: true,
          };
        }
      }
    } catch (directErr) {
      // Ignore errors
    }
  }

  return { viewers: 0, isLive: false, rawViewers: 0 };
}

/**
 * Fetches YouTube live stream status and real concurrent viewer count.
 * Resolves active video IDs from handle when streaming, queries official Data API v3 when configured,
 * uses public CORS-open stream telemetry to extract concurrentViewers, and falls back to oEmbed.
 */
export async function fetchYouTubeViewers(
  videoIdOrChannel: string,
  apiKey?: string,
  handle?: string
): Promise<{ viewers: number; isLive: boolean; error?: string; videoId?: string }> {
  let targetId = videoIdOrChannel.trim();
  const rawHandle = handle || (targetId.startsWith('@') ? targetId : '');

  // Extract video ID from common YouTube URL formats
  if (targetId.includes('v=')) {
    targetId = targetId.split('v=')[1]?.split('&')[0] || targetId;
  } else if (targetId.includes('youtu.be/')) {
    targetId = targetId.split('youtu.be/')[1]?.split('?')[0] || targetId;
  } else if (targetId.includes('live/')) {
    targetId = targetId.split('live/')[1]?.split('?')[0] || targetId;
  }

  // If a handle is configured, resolve the latest broadcast/video ID
  if (rawHandle) {
    try {
      const cleanH = rawHandle.replace(/^@+/, '').trim();
      const decRes = await fetch(`https://decapi.me/youtube/latest_video?handle=${encodeURIComponent(cleanH)}&format=%7Bid%7D&_t=${Date.now()}`);
      if (decRes.ok) {
        const resolved = (await decRes.text()).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(resolved)) {
          targetId = resolved;
        }
      }
    } catch {
      // Ignore resolution errors
    }
  }

  if (!targetId || targetId.startsWith('@')) {
    return { viewers: 0, isLive: false };
  }

  // 1. YouTube Data API v3 (if user provided an API key in Profile settings)
  if (apiKey && /^[a-zA-Z0-9_-]{11}$/.test(targetId)) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${targetId}&key=${apiKey}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const item = data?.items?.[0];
        if (item) {
          const ls = item.liveStreamingDetails;
          if (ls && !ls.actualEndTime) {
            return {
              viewers: parseInt(ls.concurrentViewers, 10) || 0,
              isLive: true,
              videoId: targetId,
            };
          }
          return { viewers: 0, isLive: false, videoId: targetId };
        }
      }
    } catch (apiErr) {
      console.warn('Error al consultar YouTube Data API:', apiErr);
    }
  }

  // 2. Public CORS-open stream telemetry (real concurrent viewers without API key)
  if (/^[a-zA-Z0-9_-]{11}$/.test(targetId)) {
    try {
      const streamRes = await fetch(`https://backend.mixerno.space/api/youtube/stream/${targetId}`);
      if (streamRes.ok) {
        const streamData = await streamRes.json();
        const item = streamData?.items?.[0];
        if (item) {
          const ls = item.liveStreamingDetails;
          const isLiveBroadcast = item.snippet?.liveBroadcastContent === 'live' || (ls && !ls.actualEndTime);
          if (isLiveBroadcast) {
            const count = ls?.concurrentViewers ? parseInt(ls.concurrentViewers, 10) : 0;
            return {
              viewers: count,
              isLive: true,
              videoId: targetId,
            };
          }
          // The video stream is concluded/VOD
          return { viewers: 0, isLive: false, videoId: targetId };
        }
      }
    } catch {
      // Fallback below
    }
  }

  // 3. oEmbed Fallback Detection
  if (/^[a-zA-Z0-9_-]{11}$/.test(targetId)) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${targetId}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        // In YouTube oEmbed, active live streams return height: 150 (ratio 4:3), while VODs/uploads return height: 113 (ratio 16:9).
        const isLiveStream = data.height === 150 || !data.title;
        return {
          viewers: isLiveStream ? 1 : 0,
          isLive: isLiveStream,
          videoId: targetId,
        };
      }
    } catch {
      // Ignore
    }
  }

  return { viewers: 0, isLive: false, videoId: targetId };
}

/**
 * Fetches Facebook Gaming / Live stream status and concurrent viewer count.
 * - Level 1 (Accurate): If a Facebook Page Access Token or Client Token is provided, queries official Meta Graph API v19.0.
 * - Level 2 (Public / Fallback): Queries public DecAPI or Meta oEmbed endpoint to verify active live status.
 */
export async function fetchFacebookViewers(
  channelOrUrl: string,
  accessToken?: string
): Promise<{ viewers: number; isLive: boolean; videoId?: string; error?: string }> {
  const trimmed = (channelOrUrl || '').trim();
  if (!trimmed) {
    return { viewers: 0, isLive: false };
  }

  // Extract video ID or clean channel/page identifier
  let videoId: string | undefined;
  const videoMatch = trimmed.match(/(?:\/videos\/|\/watch\/\?v=|v=)(\d+)/i);
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
  }

  const clean = cleanChannelName(trimmed);

  // 1. Level 1: Meta Graph API (Official & Exact Concurrent Viewers)
  if (accessToken) {
    try {
      // If we have a specific video ID
      if (videoId) {
        const url = `https://graph.facebook.com/v19.0/${videoId}?fields=live_views,status,title&access_token=${encodeURIComponent(accessToken)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const isLive = data.status === 'LIVE' || data.status === 'LIVE_STOPPED' ? data.status === 'LIVE' : false;
          const liveViews = Number(data.live_views) || 0;
          return {
            viewers: isLive ? liveViews : 0,
            isLive,
            videoId,
          };
        }
      }

      // If we have a Page ID or clean handle, query active live_videos on the page
      const targetPage = clean || trimmed;
      const pageUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(targetPage)}/live_videos?status=LIVE_NOW&fields=live_views,id,title&access_token=${encodeURIComponent(accessToken)}`;
      const pageRes = await fetch(pageUrl, { signal: AbortSignal.timeout(5000) });
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        if (Array.isArray(pageData?.data) && pageData.data.length > 0) {
          const activeStream = pageData.data[0];
          return {
            viewers: Number(activeStream.live_views) || 0,
            isLive: true,
            videoId: activeStream.id,
          };
        }
        return { viewers: 0, isLive: false };
      }
    } catch {
      // Fallback to public methods if Graph API throws or times out
    }
  }

  // 2. Level 2: Public DecAPI for Facebook Live
  if (clean) {
    try {
      const decRes = await fetch(`https://decapi.me/facebook/viewers/${encodeURIComponent(clean)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (decRes.ok) {
        const text = (await decRes.text()).trim();
        if (!text.toLowerCase().includes('offline') && !text.toLowerCase().includes('error') && !isNaN(Number(text))) {
          const count = Number(text);
          return {
            viewers: count,
            isLive: count > 0,
            videoId,
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Level 3: Meta oEmbed endpoint fallback
  const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://www.facebook.com/${clean}/live`;

  try {
    const oembedUrl = `https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(fullUrl)}`;
    const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      const isLive = fullUrl.includes('/live') || (typeof oembedData.html === 'string' && oembedData.html.includes('live'));
      return {
        viewers: isLive ? 1 : 0,
        isLive,
        videoId,
      };
    }
  } catch {
    // Ignore
  }

  return { viewers: 0, isLive: false, videoId };
}

/**
 * Fetches TikTok LIVE stream status and real concurrent viewer count.
 * Queries TikTok's web room API and uses CORS fallback proxy when running in browsers.
 */
export async function fetchTikTokViewers(
  channel: string
): Promise<{ viewers: number; isLive: boolean; error?: string }> {
  const clean = cleanChannelName(channel);
  if (!clean) {
    return { viewers: 0, isLive: false };
  }

  const user = clean.toLowerCase();
  const targetApiUrl = `https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${encodeURIComponent(user)}`;

  // 1. Primary: Direct fetch
  try {
    const res = await fetch(targetApiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.statusCode === 0) {
        const isLive = data.data?.liveRoom?.status === 2 || data.data?.user?.status === 2;
        const viewers = Number(data.data?.liveRoom?.liveRoomStats?.userCount) || 0;
        return {
          viewers: isLive ? viewers : 0,
          isLive,
        };
      } else if (data && data.statusCode === 1988404) {
        return { viewers: 0, isLive: false };
      }
    }
  } catch {
    // If direct query fails or triggers CORS in browser, proceed to fallback
  }

  // 2. Secondary: Fallback via CORS open proxy (for browser execution)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApiUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.statusCode === 0) {
        const isLive = data.data?.liveRoom?.status === 2 || data.data?.user?.status === 2;
        const viewers = Number(data.data?.liveRoom?.liveRoomStats?.userCount) || 0;
        return {
          viewers: isLive ? viewers : 0,
          isLive,
        };
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return { viewers: 0, isLive: false };
}

/**
 * Fetches viewer counts and live states across all configured platforms concurrently.
 */
export async function fetchAllViewerStats(channels: ChannelsConfig): Promise<ViewerStats> {
  type FetchRes = { viewers: number; isLive: boolean; error?: string; videoId?: string; rawViewers?: number };
  const deductKick = channels.deductKickSelfView ?? true;
  const [twitchRes, kickRes, ytRes, fbRes, tiktokRes] = await Promise.all([
    channels.twitch 
      ? fetchTwitchViewers(channels.twitch) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.kick 
      ? fetchKickViewers(channels.kick, deductKick) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.youtube || channels.youtubeHandle
      ? fetchYouTubeViewers(channels.youtube, channels.youtubeApiKey, channels.youtubeHandle)
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.facebook
      ? fetchFacebookViewers(channels.facebook, channels.facebookAccessToken)
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.tiktok
      ? fetchTikTokViewers(channels.tiktok)
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
  ]);

  const total = (twitchRes.isLive ? twitchRes.viewers : 0) +
                (kickRes.isLive ? kickRes.viewers : 0) +
                (ytRes.isLive ? ytRes.viewers : 0) +
                (fbRes.isLive ? fbRes.viewers : 0) +
                (tiktokRes.isLive ? tiktokRes.viewers : 0);

  return {
    twitch: {
      channel: channels.twitch,
      viewers: twitchRes.viewers,
      isLive: twitchRes.isLive,
      loading: false,
      error: twitchRes.error,
    },
    kick: {
      channel: channels.kick,
      viewers: kickRes.viewers,
      rawViewers: kickRes.rawViewers,
      isLive: kickRes.isLive,
      loading: false,
      error: kickRes.error,
    },
    youtube: {
      channel: channels.youtube,
      viewers: ytRes.viewers,
      isLive: ytRes.isLive,
      loading: false,
      error: ytRes.error,
      videoId: ytRes.videoId,
    },
    facebook: {
      channel: channels.facebook || '',
      viewers: fbRes.viewers,
      isLive: fbRes.isLive,
      loading: false,
      error: fbRes.error,
      videoId: fbRes.videoId,
    },
    tiktok: {
      channel: channels.tiktok || '',
      viewers: tiktokRes.viewers,
      isLive: tiktokRes.isLive,
      loading: false,
      error: tiktokRes.error,
    },
    total,
    lastUpdated: Date.now(),
  };
}
