function hasEntries(value) {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && typeof value === 'object' && Object.keys(value).length > 0;
}

export function isTransferTargetAvailable(device) {
    return Boolean(device) &&
        device.status === 'vacant' &&
        device.startTime == null &&
        device.durationLimit == null &&
        Number(device.accumulatedTimePrice) === 0 &&
        !hasEntries(device.purchases) &&
        !hasEntries(device.pastSessions);
}

export function createDeviceTransferPlan(source, target, transferredAt, calculateSessionPrice) {
    if (!source || (source.status !== 'open' && source.status !== 'timed') || !source.startTime) {
        throw new Error('يمكن نقل جلسة مفتوحة أو محددة فقط.');
    }
    if (!isTransferTargetAvailable(target)) {
        throw new Error('الجهاز الهدف غير شاغر أو يحتوي على حساب محفوظ.');
    }

    const sameType = source.type === target.type;
    let targetStartTime = source.startTime;
    let targetDurationLimit = source.durationLimit ?? null;
    const pastSessions = [...(source.pastSessions || [])];
    let transferredSession = null;

    if (!sameType) {
        let remainingMinutes = null;
        if (source.status === 'timed') {
            const scheduledEnd = source.startTime + Number(source.durationLimit) * 60000;
            const remainingMilliseconds = scheduledEnd - transferredAt;
            if (!Number.isFinite(scheduledEnd) || remainingMilliseconds <= 0) {
                throw new Error('انتهى وقت الجلسة المحددة؛ أوقفها وسجّل حسابها قبل النقل.');
            }
            remainingMinutes = Math.ceil(remainingMilliseconds / 60000);
        }

        const scheduledEnd = source.status === 'timed'
            ? source.startTime + Number(source.durationLimit) * 60000
            : transferredAt;
        transferredSession = {
            startTime: source.startTime,
            endTime: Math.min(transferredAt, scheduledEnd),
            price: calculateSessionPrice(source, transferredAt)
        };
        pastSessions.push(transferredSession);
        targetStartTime = transferredAt;
        targetDurationLimit = remainingMinutes;
    }

    return {
        amount: sameType ? 0 : transferredSession.price,
        sourceUpdates: {
            status: 'vacant',
            startTime: null,
            durationLimit: null,
            accumulatedTimePrice: 0,
            purchases: [],
            pastSessions: []
        },
        targetUpdates: {
            status: source.status,
            startTime: targetStartTime,
            durationLimit: targetDurationLimit,
            accumulatedTimePrice: Number(source.accumulatedTimePrice) || 0,
            purchases: [...(source.purchases || [])],
            pastSessions
        },
        details: {
            mode: sameType ? 'same_type' : 'different_type',
            transferredAt,
            sourceSession: {
                status: source.status,
                startTime: source.startTime,
                durationLimit: source.durationLimit ?? null,
                accruedSession: transferredSession
            },
            targetSession: {
                status: source.status,
                startTime: targetStartTime,
                durationLimit: targetDurationLimit
            },
            movedAccount: {
                accumulatedTimePrice: Number(source.accumulatedTimePrice) || 0,
                purchases: [...(source.purchases || [])],
                pastSessions: [...(source.pastSessions || [])]
            }
        }
    };
}
