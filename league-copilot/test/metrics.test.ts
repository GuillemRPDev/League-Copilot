import { describe, expect, it } from "@jest/globals";
import { calculateMatchMetrics, buildCoachPrompt } from "../lib/metrics";

describe("calculateMatchMetrics", () => {
  it("computes the expected per-match metrics and rounding", () => {
    const result = calculateMatchMetrics({
      gameDuration: 1800,
      championId: 84,
      kills: 8,
      deaths: 3,
      assists: 11,
      totalMinionsKilled: 180,
      goldEarned: 12000,
      damageDealtToChampions: 18000,
      damageTaken: 19000,
      visionScore: 18,
      wardsPlaced: 8,
      longestTimeSpentLiving: 420,
      teamId: 100,
      win: true,
      queueId: 420,
    });

    expect(result).toMatchObject({
      championId: 84,
      csPerMinute: 6,
      kda: 6.33,
      goldPerMinute: 400,
      damagePerMinute: 600,
      deathsPerMinute: 0.1,
      visionScore: 18,
      win: true,
    });
  });
});

describe("buildCoachPrompt", () => {
  it("creates a concise coaching brief with prioritized focus areas", () => {
    const prompt = buildCoachPrompt([
      {
        championId: 84,
        csPerMinute: 4.7,
        kda: 2.4,
        goldPerMinute: 290,
        damagePerMinute: 510,
        deathsPerMinute: 0.7,
        visionScore: 10,
        win: false,
      },
      {
        championId: 84,
        csPerMinute: 6.1,
        kda: 5.7,
        goldPerMinute: 430,
        damagePerMinute: 620,
        deathsPerMinute: 0.2,
        visionScore: 15,
        win: true,
      },
    ]);

    expect(prompt).toContain("League of Legends coaching");
    expect(prompt).toContain("priority");
    expect(prompt).toContain("CS/min");
  });
});