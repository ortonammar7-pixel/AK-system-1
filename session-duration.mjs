export function calculateTimedSessionDuration(baseMinutes, extraTimeEnabled, extraMinutes) {
    const additionalMinutes = getAdditionalMinutes(extraTimeEnabled, extraMinutes);
    if (!Number.isSafeInteger(baseMinutes) || baseMinutes <= 0) {
        throw new Error('يرجى إدخال عدد دقائق صحيح');
    }

    const totalMinutes = baseMinutes + additionalMinutes;
    if (!Number.isSafeInteger(totalMinutes)) {
        throw new Error('إجمالي مدة الجلسة كبير جداً');
    }
    return totalMinutes;
}

export function getAdditionalMinutes(extraTimeEnabled, extraMinutes) {
    const additionalMinutes = extraTimeEnabled ? extraMinutes : 0;
    if (!Number.isSafeInteger(additionalMinutes) || additionalMinutes < 0 ||
        (extraTimeEnabled && additionalMinutes === 0)) {
        throw new Error('يرجى إدخال عدد الدقائق الإضافية بشكل صحيح');
    }
    return additionalMinutes;
}

export function getOpenSessionStartTime(startTime, startOffsetMinutes, legacyFreeTimeUntil = null) {
    let offsetMinutes = Number(startOffsetMinutes) || 0;
    if (offsetMinutes <= 0 && Number(legacyFreeTimeUntil) > startTime) {
        offsetMinutes = (Number(legacyFreeTimeUntil) - startTime) / 60000;
    }
    return startTime - Math.max(0, offsetMinutes) * 60000;
}

export function getOpenSessionDisplaySeconds(startTime, startOffsetMinutes, now, legacyFreeTimeUntil = null) {
    const adjustedStartTime = getOpenSessionStartTime(startTime, startOffsetMinutes, legacyFreeTimeUntil);
    return { label: '', seconds: Math.max(0, Math.floor((now - adjustedStartTime) / 1000)) };
}

export function getOpenSessionBillableMinutes(startTime, startOffsetMinutes, endTime, legacyFreeTimeUntil = null) {
    const adjustedStartTime = getOpenSessionStartTime(startTime, startOffsetMinutes, legacyFreeTimeUntil);
    return Math.max(0, (endTime - adjustedStartTime) / 60000);
}
