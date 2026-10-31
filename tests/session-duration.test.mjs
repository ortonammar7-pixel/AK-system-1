import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateTimedSessionDuration,
    getOpenSessionBillableMinutes,
    getOpenSessionDisplaySeconds
} from '../session-duration.mjs';

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

test('open-session extra time is displayed as a grace countdown and is not billed', () => {
    const startedAt = 1_000_000;
    const freeTimeUntil = startedAt + 10 * 60_000;
    assert.deepEqual(getOpenSessionDisplaySeconds(startedAt, freeTimeUntil, startedAt + 30_000), {
        label: 'وقت إضافي',
        seconds: 570
    });
    assert.equal(getOpenSessionBillableMinutes(startedAt, freeTimeUntil, freeTimeUntil), 0);
    assert.equal(getOpenSessionBillableMinutes(startedAt, freeTimeUntil, freeTimeUntil + 10 * 60_000), 10);
    assert.deepEqual(getOpenSessionDisplaySeconds(startedAt, freeTimeUntil, freeTimeUntil + 30_000), {
        label: '',
        seconds: 30
    });
});
