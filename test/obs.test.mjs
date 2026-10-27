import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeObsAuth,
  formatObsTimecode,
  formatObsBytes,
  calculateObsDropRate,
  ObsWebSocketClient,
  DEFAULT_OBS_CONFIG,
  INITIAL_OBS_STATS,
} from '../src/utils/obsWebSocket.ts';

test('computeObsAuth correctly calculates OBS WebSocket v5 SHA256 challenge response', async () => {
  const password = 'supersecretpassword';
  const salt = 'sample_obs_salt_123';
  const challenge = 'sample_obs_challenge_456';

  const authString = await computeObsAuth(password, salt, challenge);
  assert.ok(typeof authString === 'string', 'Expected authString to be a string');
  assert.ok(authString.length > 20, 'Expected non-empty base64 string');

  // Verify consistency with another run with same parameters
  const secondRun = await computeObsAuth(password, salt, challenge);
  assert.equal(authString, secondRun, 'Auth response must be deterministic');

  // Verify different password yields different hash
  const differentPasswordRun = await computeObsAuth('wrongpassword', salt, challenge);
  assert.notEqual(authString, differentPasswordRun, 'Different password must yield different hash');
});

test('formatObsTimecode correctly converts milliseconds to HH:MM:SS', () => {
  assert.equal(formatObsTimecode(0), '00:00:00');
  assert.equal(formatObsTimecode(-500), '00:00:00');
  assert.equal(formatObsTimecode(45000), '00:00:45');
  assert.equal(formatObsTimecode(65000), '00:01:05');
  assert.equal(formatObsTimecode(3665000), '01:01:05');
  assert.equal(formatObsTimecode(7325000), '02:02:05');
});

test('formatObsBytes formats bytes into human-readable MB and GB', () => {
  assert.equal(formatObsBytes(0), '0 MB');
  assert.equal(formatObsBytes(10485760), '10.0 MB');
  assert.equal(formatObsBytes(52428800), '50.0 MB');
  assert.equal(formatObsBytes(1073741824), '1.00 GB');
  assert.equal(formatObsBytes(1610612736), '1.50 GB');
});

test('calculateObsDropRate calculates dropped frame percentages accurately', () => {
  assert.equal(calculateObsDropRate(0, 0), 0);
  assert.equal(calculateObsDropRate(0, 10000), 0);
  assert.equal(calculateObsDropRate(50, 10000), 0.5);
  assert.equal(calculateObsDropRate(150, 10000), 1.5);
  assert.equal(calculateObsDropRate(234, 100000), 0.23);
});

test('ObsWebSocketClient initializes with initial stats and disconnected status', () => {
  const client = new ObsWebSocketClient(DEFAULT_OBS_CONFIG);
  assert.equal(client.getStatus(), 'disconnected');
  assert.deepEqual(client.getStats(), INITIAL_OBS_STATS);
  assert.equal(client.isConnected(), false);
});
