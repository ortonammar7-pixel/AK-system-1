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

export function getOpenSessionDisplaySeconds(startTime, freeTimeUntil, now) {
    const remainingFreeSeconds = Math.ceil((Number(freeTimeUntil) - now) / 1000);
    if (remainingFreeSeconds > 0) {
        return { label: 'وقت إضافي', seconds: remainingFreeSeconds };
    }
    const billingStartTime = Math.max(startTime, Number(freeTimeUntil) || startTime);
    return { label: '', seconds: Math.max(0, Math.floor((now - billingStartTime) / 1000)) };
}

export function getOpenSessionBillableMinutes(startTime, freeTimeUntil, endTime) {
    const billingStartTime = Math.max(startTime, Number(freeTimeUntil) || startTime);
    return Math.max(0, (endTime - billingStartTime) / 60000);
}
