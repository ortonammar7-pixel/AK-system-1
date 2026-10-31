import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeviceTransferPlan, isTransferTargetAvailable } from '../device-transfer.mjs';

const emptyTarget = (id, type) => ({
    id,
    name: id,
    type,
    status: 'vacant',
    startTime: null,
    durationLimit: null,
    freeTimeUntil: null,
    startOffsetMinutes: 0,
    accumulatedTimePrice: 0,
    purchases: [],
    pastSessions: []
});

test('same-type transfer preserves the active session and account data', () => {
    const source = {
        id: 'PC1',
        type: 'PC',
        status: 'timed',
        startTime: 1000,
        durationLimit: 45,
        freeTimeUntil: null,
        startOffsetMinutes: 0,
        accumulatedTimePrice: 500,
        purchases: [{ name: 'ماء', price: 500 }],
        pastSessions: [{ startTime: 1, endTime: 2, price: 250 }]
    };
    const target = emptyTarget('PC2', 'PC');
    const plan = createDeviceTransferPlan(source, target, 9000, () => {
        throw new Error('same-type transfer must not recalculate session price');
    });

    assert.equal(plan.amount, 0);
    assert.deepEqual(plan.targetUpdates, {
        status: 'timed',
        startTime: 1000,
        durationLimit: 45,
        freeTimeUntil: null,
        startOffsetMinutes: 0,
        accumulatedTimePrice: 500,
        purchases: source.purchases,
        pastSessions: source.pastSessions
    });
    assert.deepEqual(plan.sourceUpdates, {
        status: 'vacant',
        startTime: null,
        durationLimit: null,
        freeTimeUntil: null,
        startOffsetMinutes: 0,
        accumulatedTimePrice: 0,
        purchases: [],
        pastSessions: []
    });
});

test('different-type transfer accrues source time and starts a fresh timed session', () => {
    const source = {
        id: 'PC1',
        type: 'PC',
        status: 'timed',
        startTime: 1_000_000,
        durationLimit: 60,
        freeTimeUntil: null,
        accumulatedTimePrice: 250,
        purchases: [{ name: 'بيبسي', price: 1000 }],
        pastSessions: [{ startTime: 1, endTime: 2, price: 250 }]
    };
    const target = emptyTarget('PS51', 'PS5');
    const transferredAt = source.startTime + 12 * 60_000 + 30_000;
    const plan = createDeviceTransferPlan(source, target, transferredAt, (device, endTime) => {
        assert.equal(device, source);
        assert.equal(endTime, transferredAt);
        return 250;
    });

    assert.equal(plan.amount, 250);
    assert.equal(plan.targetUpdates.status, 'timed');
    assert.equal(plan.targetUpdates.startTime, transferredAt);
    assert.equal(plan.targetUpdates.durationLimit, 48);
    assert.equal(plan.targetUpdates.accumulatedTimePrice, 250);
    assert.deepEqual(plan.targetUpdates.purchases, source.purchases);
    assert.deepEqual(plan.targetUpdates.pastSessions[plan.targetUpdates.pastSessions.length - 1], {
        startTime: source.startTime,
        endTime: transferredAt,
        price: 250
    });
    assert.equal(plan.details.mode, 'different_type');
});

test('different-type transfer keeps an open session open and begins it at transfer time', () => {
    const source = {
        type: 'PS5',
        status: 'open',
        startTime: 500,
        durationLimit: null,
        freeTimeUntil: null,
        startOffsetMinutes: 0,
        accumulatedTimePrice: 0,
        purchases: [],
        pastSessions: []
    };
    const transferredAt = 90_000;
    const plan = createDeviceTransferPlan(
        source,
        emptyTarget('PC2', 'PC'),
        transferredAt,
        () => 500
    );

    assert.equal(plan.amount, 500);
    assert.equal(plan.targetUpdates.status, 'open');
    assert.equal(plan.targetUpdates.startTime, transferredAt);
    assert.equal(plan.targetUpdates.durationLimit, null);
    assert.equal(plan.details.targetSession.startTime, transferredAt);
});

test('legacy open-session delay is preserved on same type and accrued before cross-type restart', () => {
    const freeTimeUntil = 180_000;
    const source = {
        type: 'PC',
        status: 'open',
        startTime: 60_000,
        durationLimit: null,
        freeTimeUntil,
        startOffsetMinutes: 0,
        accumulatedTimePrice: 0,
        purchases: [],
        pastSessions: []
    };
    const sameTypePlan = createDeviceTransferPlan(source, emptyTarget('PC2', 'PC'), 90_000, () => 0);
    assert.equal(sameTypePlan.targetUpdates.freeTimeUntil, freeTimeUntil);

    let calculated;
    const crossTypePlan = createDeviceTransferPlan(source, emptyTarget('PS51', 'PS5'), 90_000, (device, endTime) => {
        calculated = { device, endTime };
        return 250;
    });
    assert.deepEqual(calculated, { device: source, endTime: 90_000 });
    assert.equal(crossTypePlan.targetUpdates.startTime, 90_000);
    assert.equal(crossTypePlan.targetUpdates.freeTimeUntil, null);
    assert.equal(crossTypePlan.targetUpdates.startOffsetMinutes, 0);
    assert.equal(crossTypePlan.details.sourceSession.accruedSession.startTime, -60_000);
    assert.equal(crossTypePlan.sourceUpdates.freeTimeUntil, null);
});

test('a target with a locked state or any saved account data is unavailable', () => {
    assert.equal(isTransferTargetAvailable(emptyTarget('PC2', 'PC')), true);
    assert.equal(isTransferTargetAvailable({ ...emptyTarget('PC2', 'PC'), status: 'locked' }), false);
    assert.equal(isTransferTargetAvailable({
        ...emptyTarget('PC2', 'PC'),
        pastSessions: [{ price: 250 }]
    }), false);
    assert.equal(isTransferTargetAvailable({
        ...emptyTarget('PC2', 'PC'),
        accumulatedTimePrice: 100
    }), false);
    assert.equal(isTransferTargetAvailable({
        ...emptyTarget('PC2', 'PC'),
        freeTimeUntil: Date.now() + 60_000
    }), false);

    assert.throws(() => createDeviceTransferPlan(
        { status: 'open', startTime: 1, type: 'PC' },
        { ...emptyTarget('PC2', 'PC'), purchases: [{ name: 'ماء' }] },
        2,
        () => 0
    ), /غير شاغر/);
});

test('expired timed sessions cannot be transferred across device types', () => {
    const source = {
        type: 'PC',
        status: 'timed',
        startTime: 1000,
        durationLimit: 1,
        freeTimeUntil: null,
        startOffsetMinutes: 0,
        purchases: [],
        pastSessions: []
    };

    assert.throws(() => createDeviceTransferPlan(
        source,
        emptyTarget('PS51', 'PS5'),
        61_000,
        () => 250
    ), /انتهى وقت الجلسة/);
});
