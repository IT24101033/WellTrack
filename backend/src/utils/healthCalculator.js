'use strict';

/** Auto-compute BMI from height (cm) and weight (kg) */
const computeBMI = (height, weight) => {
    if (!height || !weight || height <= 0) return null;
    return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
};

/**
 * Health score (0–100):
 *   Sleep         25%
 *   Stress        25% (inverted)
 *   Activity      20%
 *   Nutrition     15%
 *   Screen behav. 15%
 */
const computeHealthScore = (data) => {
    const { physiological, activity, lifestyle, psychological } = data;

    // Sleep: 0–10 → ideal = 8h quality = 8
    const sleepRaw = Math.min((physiological?.sleepHours ?? 0) / 8, 1) * 0.5 +
        Math.min((physiological?.sleepQuality ?? 0) / 10, 1) * 0.5;
    const sleepScore = sleepRaw * 25;

    // Stress inverse: score 1 → 25pts, score 10 → 0pts
    const stressScore = ((10 - (psychological?.stressScore ?? 5)) / 9) * 25;

    // Activity: steps 10000 = full, exerciseMinutes 60 = full
    const stepsNorm = Math.min((activity?.stepsPerDay ?? 0) / 10000, 1);
    const exNorm = Math.min((activity?.exerciseMinutes ?? 0) / 60, 1);
    const sedNorm = 1 - Math.min((activity?.sedentaryHours ?? 0) / 16, 1);
    const activityScore = ((stepsNorm + exNorm + sedNorm) / 3) * 20;

    // Nutrition: water ≥ 2.5L = full, junk = never → best
    const waterNorm = Math.min((lifestyle?.waterIntake ?? 0) / 2.5, 1);
    const junkMap = { Never: 1, Weekly: 0.75, '2-3 times': 0.4, Daily: 0 };
    const junkNorm = junkMap[lifestyle?.junkFoodFrequency] ?? 0.5;
    const nutritionScore = ((waterNorm + junkNorm) / 2) * 15;

    // Screen behavior: screenTime ≤ 4h ideal, lateNight = penalty
    const screenNorm = 1 - Math.min((activity?.screenTimeHours ?? 0) / 12, 1);
    const lateNightPenalty = activity?.lateNightScreen ? 0.3 : 0;
    const screenScore = (screenNorm - lateNightPenalty) * 15;

    return Math.max(0, Math.min(100, Math.round(sleepScore + stressScore + activityScore + nutritionScore + screenScore)));
};

module.exports = {
    computeBMI,
    computeHealthScore
};
