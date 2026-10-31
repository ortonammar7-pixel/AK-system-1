export function calculateTimedSessionDuration(baseMinutes, extraTimeEnabled, extraMinutes) {
    if (!Number.isSafeInteger(baseMinutes) || baseMinutes <= 0) {
        throw new Error('يرجى إدخال عدد دقائق صحيح');
    }

    const additionalMinutes = extraTimeEnabled ? extraMinutes : 0;
    if (!Number.isSafeInteger(additionalMinutes) || additionalMinutes < 0 ||
        (extraTimeEnabled && additionalMinutes === 0)) {
        throw new Error('يرجى إدخال عدد الدقائق الإضافية بشكل صحيح');
    }

    const totalMinutes = baseMinutes + additionalMinutes;
    if (!Number.isSafeInteger(totalMinutes)) {
        throw new Error('إجمالي مدة الجلسة كبير جداً');
    }
    return totalMinutes;
}
