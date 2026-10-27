import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HEALTH_SERVICES,
  calculateJitter,
  getStreamRecommendation,
  detectStreamDrops,
  pingServiceEndpoint,
  runFullHealthDiagnostics,
  isWidgetStreamActive,
} from '../src/utils/streamHealth.ts';

test('HEALTH_SERVICES contains all 5 primary streaming endpoints', () => {
  assert.equal(HEALTH_SERVICES.length, 5);
  const ids = HEALTH_SERVICES.map(s => s.id);
  assert.ok(ids.includes('cloudflare'), 'Missing Cloudflare service');
  assert.ok(ids.includes('youtube'), 'Missing YouTube service');
  assert.ok(ids.includes('twitch'), 'Missing Twitch service');
  assert.ok(ids.includes('kick'), 'Missing Kick service');
  assert.ok(ids.includes('streamlabs'), 'Missing Streamlabs service');
});

test('calculateJitter accurately computes latency variance', () => {
  assert.equal(calculateJitter([]), 0);
  assert.equal(calculateJitter([50]), 0);
  assert.equal(calculateJitter([40, 40, 40, 40]), 0);
  const jitter = calculateJitter([30, 40, 50, 60]);
  assert.ok(jitter > 10 && jitter < 15, `Expected jitter around 11-13, got ${jitter}`);
});

test('getStreamRecommendation gives accurate streaming guidance', () => {
  const excellentRec = getStreamRecommendation('excellent', 35, 5, 0);
  assert.match(excellentRec, /excelente/i);
  assert.match(excellentRec, /1080p60/i);

  const fairRec = getStreamRecommendation('fair', 120, 45, 0);
  assert.match(fairRec, /fluctuante/i);
  assert.match(fairRec, /720p60|4500/i);

  const poorRec = getStreamRecommendation('poor', 260, 10, 25);
  assert.match(poorRec, /deficiente/i);
  assert.match(poorRec, /riesgo/i);

  const offlineRec = getStreamRecommendation('offline', 999, 0, 100);
  assert.match(offlineRec, /sin conexión/i);
});

test('detectStreamDrops identifies unexpected stream disconnections', () => {
  const previousStats = {
    twitch: { channel: 'samo2105', viewers: 150, isLive: true, loading: false },
    kick: { channel: 'samo_kick', viewers: 50, isLive: true, loading: false },
    youtube: { channel: 'SwjSwFWmxl0', viewers: 200, isLive: true, loading: false },
    total: 400,
  };

  // Case 1: Twitch dropped
  const currentStatsTwitchDown = {
    ...previousStats,
    twitch: { channel: 'samo2105', viewers: 0, isLive: false, loading: false },
  };
  const alertsTwitch = detectStreamDrops(previousStats, currentStatsTwitchDown);
  assert.equal(alertsTwitch.length, 1);
  assert.match(alertsTwitch[0], /Twitch/i);

  // Case 2: All still live -> 0 alerts
  const alertsAllLive = detectStreamDrops(previousStats, previousStats);
  assert.equal(alertsAllLive.length, 0);

  // Case 3: YouTube dropped
  const currentStatsYtDown = {
    ...previousStats,
    youtube: { channel: 'SwjSwFWmxl0', viewers: 0, isLive: false, loading: false },
  };
  const alertsYt = detectStreamDrops(previousStats, currentStatsYtDown);
  assert.equal(alertsYt.length, 1);
  assert.match(alertsYt[0], /YouTube/i);

  // Case 4: Kick dropped
  const currentStatsKickDown = {
    ...previousStats,
    kick: { channel: 'samo_kick', viewers: 0, isLive: false, loading: false },
  };
  const alertsKick = detectStreamDrops(previousStats, currentStatsKickDown);
  assert.equal(alertsKick.length, 1);
  assert.match(alertsKick[0], /Kick/i);
});

test('isWidgetStreamActive correctly evaluates stream connection status per platform', () => {
  const offlineStats = {
    twitch: { channel: 'samo2105', viewers: 0, isLive: false, loading: false },
    kick: { channel: 'samo_kick', viewers: 0, isLive: false, loading: false },
    youtube: { channel: 'SwjSwFWmxl0', viewers: 0, isLive: false, loading: false },
    total: 0,
  };

  const twitchLiveStats = {
    ...offlineStats,
    twitch: { channel: 'samo2105', viewers: 100, isLive: true, loading: false },
  };

  // 1. When all are offline and OBS is inactive
  assert.equal(isWidgetStreamActive('twitch', 'https://twitch.tv/embed/samo2105/chat', offlineStats, false), false);
  assert.equal(isWidgetStreamActive('kick', 'https://kick.com/popout/samo/chat', offlineStats, false), false);
  assert.equal(isWidgetStreamActive('youtube', 'https://youtube.com/live_chat?v=123', offlineStats, false), false);
  assert.equal(isWidgetStreamActive('eventlist', 'https://streamlabs.com/widgets/event-list/v1/token', offlineStats, false), false);

  // 2. When Twitch is live: Twitch widget and general widgets are active
  assert.equal(isWidgetStreamActive('twitch', 'https://twitch.tv/embed/samo2105/chat', twitchLiveStats, false), true);
  assert.equal(isWidgetStreamActive('eventlist', 'https://streamlabs.com/widgets/event-list/v1/token', twitchLiveStats, false), true);
  assert.equal(isWidgetStreamActive('kick', 'https://kick.com/popout/samo/chat', twitchLiveStats, false), false);

  // 3. When OBS is actively streaming: all widgets are active regardless of platform
  assert.equal(isWidgetStreamActive('twitch', 'https://twitch.tv/embed/samo2105/chat', offlineStats, true), true);
  assert.equal(isWidgetStreamActive('kick', 'https://kick.com/popout/samo/chat', offlineStats, true), true);
  assert.equal(isWidgetStreamActive('eventlist', 'https://streamlabs.com/widgets/event-list/v1/token', offlineStats, true), true);

  // 4. When stats are null
  assert.equal(isWidgetStreamActive('twitch', 'https://twitch.tv/embed/samo2105/chat', null, false), false);
});

test('pingServiceEndpoint handles timeout / unreachable endpoints gracefully', async () => {
  const dummyService = {
    id: 'dummy_offline',
    name: 'Dummy Service',
    category: 'cdn',
    url: 'https://192.0.2.1/non-existent-endpoint', // TEST-NET-1 IP that will timeout
    description: 'Timeout test endpoint',
  };
  const result = await pingServiceEndpoint(dummyService, 800);
  assert.equal(result.success, false);
  assert.equal(result.status, 'offline');
  assert.ok(result.error);
});

test('pingServiceEndpoint verifies all individual streaming services', async () => {
  for (const service of HEALTH_SERVICES) {
    const result = await pingServiceEndpoint(service, 6000);
    assert.ok(result.id, `Result should have id for ${service.name}`);
    assert.ok(result.latencyMs >= 0, `Latency must be non-negative for ${service.name}`);
    assert.ok(
      ['excellent', 'good', 'fair', 'poor', 'offline'].includes(result.status),
      `Invalid status for ${service.name}: ${result.status}`
    );
  }
});

test('runFullHealthDiagnostics completes across all services and returns overall rating', async () => {
  const summary = await runFullHealthDiagnostics();
  assert.ok(summary);
  assert.equal(summary.services.length, 5);
  assert.ok(['excellent', 'good', 'fair', 'poor', 'offline'].includes(summary.overallRating));
  assert.ok(summary.averageLatencyMs > 0);
  assert.ok(typeof summary.recommendation === 'string' && summary.recommendation.length > 0);
});
