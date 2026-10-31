import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTimedSessionDuration } from '../session-duration.mjs';

test('keeps the original timed duration when extra time is disabled', () => {
    assert.equal(calculateTimedSessionDuration(60, false, 10), 60);
});

test('adds the selected extra minutes when enabled', () => {
    assert.equal(calculateTimedSessionDuration(60, true, 10), 70);
    assert.equal(calculateTimedSessionDuration(60, true, 25), 85);
});

test('rejects invalid base or enabled extra minutes', () => {
    assert.throws(() => calculateTimedSessionDuration(0, false, 10), /عدد دقائق صحيح/);
    assert.throws(() => calculateTimedSessionDuration(60, true, 0), /الدقائق الإضافية/);
    assert.throws(() => calculateTimedSessionDuration(60, true, 1.5), /الدقائق الإضافية/);
});
