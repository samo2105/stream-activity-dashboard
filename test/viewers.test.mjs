import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanChannelName,
  fetchTwitchViewers,
  fetchKickViewers,
  fetchYouTubeViewers,
  fetchAllViewerStats,
} from '../src/utils/viewers.ts';

test('cleanChannelName sanitizes channel names from various input formats', () => {
  assert.equal(cleanChannelName(''), '');
  assert.equal(cleanChannelName('   '), '');
  assert.equal(cleanChannelName('@samo2105'), 'samo2105');
  assert.equal(cleanChannelName('@@@zannito'), 'zannito');
  assert.equal(cleanChannelName('https://twitch.tv/samo2105'), 'samo2105');
  assert.equal(cleanChannelName('https://www.twitch.tv/samo2105/chat'), 'samo2105');
  assert.equal(cleanChannelName('https://kick.com/samo2105'), 'samo2105');
  assert.equal(cleanChannelName('https://www.youtube.com/@zannito'), 'zannito');
});

test('fetchTwitchViewers handles empty channel input gracefully', async () => {
  const result = await fetchTwitchViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);

  const whitespaceResult = await fetchTwitchViewers('   ');
  assert.equal(whitespaceResult.isLive, false);
  assert.equal(whitespaceResult.viewers, 0);
});

test('fetchTwitchViewers queries official GQL endpoint and pulls real viewers', async () => {
  const result = await fetchTwitchViewers('zannito21');
  assert.equal(typeof result.isLive, 'boolean');
  assert.equal(typeof result.viewers, 'number');
  assert.ok(result.viewers >= 0);
});

test('fetchKickViewers handles empty channel input gracefully', async () => {
  const result = await fetchKickViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);
  assert.equal(result.rawViewers, 0);
});

test('fetchKickViewers pulls real live state and viewer count with self-view deduction', async () => {
  const adjusted = await fetchKickViewers('zannito21', true);
  assert.equal(typeof adjusted.isLive, 'boolean');
  assert.equal(typeof adjusted.viewers, 'number');
  assert.ok(adjusted.viewers >= 0);
  assert.equal(typeof adjusted.rawViewers, 'number');
  assert.ok(adjusted.rawViewers >= adjusted.viewers);

  const raw = await fetchKickViewers('zannito21', false);
  assert.equal(typeof raw.isLive, 'boolean');
  assert.equal(raw.viewers, raw.rawViewers);
  if (raw.isLive && raw.rawViewers > 0) {
    assert.equal(adjusted.viewers, raw.rawViewers - 1);
  }
});

test('fetchKickViewers calculates self-view deduction accurately with mock response', async () => {
  const originalFetch = globalThis.fetch;
  try {
    // 1 viewer (only streamer is connected)
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        livestream: {
          is_live: true,
          viewer_count: 1,
        },
      }),
    });

    const deducted1 = await fetchKickViewers('testchannel', true);
    assert.equal(deducted1.isLive, true);
    assert.equal(deducted1.viewers, 0); // 1 - 1 = 0
    assert.equal(deducted1.rawViewers, 1);

    const nonDeducted1 = await fetchKickViewers('testchannel', false);
    assert.equal(nonDeducted1.isLive, true);
    assert.equal(nonDeducted1.viewers, 1);
    assert.equal(nonDeducted1.rawViewers, 1);

    // 5 viewers (streamer + 4 audience members)
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        livestream: {
          is_live: true,
          viewer_count: 5,
        },
      }),
    });

    const deducted5 = await fetchKickViewers('testchannel', true);
    assert.equal(deducted5.viewers, 4); // 5 - 1 = 4
    assert.equal(deducted5.rawViewers, 5);

    // 0 viewers
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        livestream: {
          is_live: true,
          viewer_count: 0,
        },
      }),
    });

    const deducted0 = await fetchKickViewers('testchannel', true);
    assert.equal(deducted0.viewers, 0);
    assert.equal(deducted0.rawViewers, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchYouTubeViewers handles empty inputs gracefully', async () => {
  const result = await fetchYouTubeViewers('');
  assert.equal(result.isLive, false);
  assert.equal(result.viewers, 0);
});

test('fetchYouTubeViewers extracts video ID from different YouTube URL structures', async () => {
  const r1 = await fetchYouTubeViewers('https://www.youtube.com/watch?v=SwjSwFWmxl0');
  assert.equal(r1.videoId, 'SwjSwFWmxl0');

  const r2 = await fetchYouTubeViewers('https://youtu.be/SwjSwFWmxl0?si=123');
  assert.equal(r2.videoId, 'SwjSwFWmxl0');

  const r3 = await fetchYouTubeViewers('https://www.youtube.com/live/SwjSwFWmxl0');
  assert.equal(r3.videoId, 'SwjSwFWmxl0');
});

test('fetchYouTubeViewers correctly differentiates active live broadcast from finished VOD with real viewers', async () => {
  // SwjSwFWmxl0 is a concluded VOD
  const vodResult = await fetchYouTubeViewers('SwjSwFWmxl0');
  assert.equal(vodResult.isLive, false);
  assert.equal(vodResult.viewers, 0);
  assert.equal(vodResult.videoId, 'SwjSwFWmxl0');

  // Video ID structure check and non-negative viewers
  const liveResult = await fetchYouTubeViewers('7aijN13K2nI');
  assert.equal(typeof liveResult.isLive, 'boolean');
  assert.equal(typeof liveResult.viewers, 'number');
  assert.ok(liveResult.viewers >= 0);
  assert.equal(liveResult.videoId, '7aijN13K2nI');
});

test('fetchYouTubeViewers resolves latest stream when handle is provided and pulls viewers', async () => {
  const result = await fetchYouTubeViewers('SwjSwFWmxl0', undefined, 'zannito');
  assert.ok(result.videoId);
  assert.equal(typeof result.isLive, 'boolean');
  assert.equal(typeof result.viewers, 'number');
  assert.ok(result.viewers >= 0);
});

test('fetchAllViewerStats aggregates multiplatform channels concurrently with real viewers', async () => {
  const channels = {
    twitch: 'zannito21',
    kick: 'zannito21',
    youtube: '7aijN13K2nI',
    youtubeHandle: 'zannito',
    deductKickSelfView: true,
  };

  const stats = await fetchAllViewerStats(channels);
  assert.ok(stats.twitch);
  assert.ok(stats.kick);
  assert.ok(stats.youtube);
  assert.equal(typeof stats.kick.viewers, 'number');
  assert.ok(stats.kick.viewers >= 0);
  assert.equal(typeof stats.youtube.isLive, 'boolean');
  assert.ok(stats.youtube.videoId);
  assert.equal(typeof stats.total, 'number');
  assert.ok(stats.total >= 0);
  assert.ok(stats.lastUpdated);
});
