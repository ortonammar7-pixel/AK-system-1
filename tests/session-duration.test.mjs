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

test('open-session extra time is added to elapsed and billable time immediately', () => {
    const startedAt = 1_000_000;
    const delayMinutes = 10;
    assert.deepEqual(getOpenSessionDisplaySeconds(startedAt, delayMinutes, startedAt + 30_000), {
        label: '',
        seconds: 630
    });
    assert.equal(getOpenSessionBillableMinutes(startedAt, delayMinutes, startedAt + 30_000), 10.5);
    assert.deepEqual(getOpenSessionDisplaySeconds(startedAt, delayMinutes, startedAt + 10 * 60_000), {
        label: '',
        seconds: 1200
    });
});

test('legacy open-session grace values become elapsed-time offsets', () => {
    const startedAt = 1_000_000;
    const legacyFreeTimeUntil = startedAt + 10 * 60_000;
    assert.deepEqual(getOpenSessionDisplaySeconds(startedAt, 0, startedAt + 30_000, legacyFreeTimeUntil), {
        label: '',
        seconds: 630
    });
    assert.equal(getOpenSessionBillableMinutes(startedAt, 0, startedAt + 30_000, legacyFreeTimeUntil), 10.5);
});
