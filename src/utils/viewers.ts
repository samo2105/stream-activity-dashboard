import type { ChannelsConfig, ViewerStats } from '../types/widget';

/**
 * Sanitizes channel inputs removing URLs, protocols, '@' symbols, and query parameters.
 */
export function cleanChannelName(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?(twitch\.tv|kick\.com|youtube\.com)\/?/i, '')
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
 * Fetches viewer counts and live states across all configured platforms concurrently.
 */
export async function fetchAllViewerStats(channels: ChannelsConfig): Promise<ViewerStats> {
  type FetchRes = { viewers: number; isLive: boolean; error?: string; videoId?: string; rawViewers?: number };
  const deductKick = channels.deductKickSelfView ?? true;
  const [twitchRes, kickRes, ytRes] = await Promise.all([
    channels.twitch 
      ? fetchTwitchViewers(channels.twitch) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.kick 
      ? fetchKickViewers(channels.kick, deductKick) 
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
    channels.youtube || channels.youtubeHandle
      ? fetchYouTubeViewers(channels.youtube, channels.youtubeApiKey, channels.youtubeHandle)
      : Promise.resolve<FetchRes>({ viewers: 0, isLive: false }),
  ]);

  const total = (twitchRes.isLive ? twitchRes.viewers : 0) +
                (kickRes.isLive ? kickRes.viewers : 0) +
                (ytRes.isLive ? ytRes.viewers : 0);

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
    total,
    lastUpdated: Date.now(),
  };
}
