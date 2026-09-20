export type MatchMetricsInput = {
  gameDuration: number;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  goldEarned: number;
  damageDealtToChampions: number;
  damageTaken: number;
  visionScore: number;
  wardsPlaced: number;
  longestTimeSpentLiving: number;
  teamId: number;
  win: boolean;
  queueId: number;
};

export type MatchMetrics = {
  championId: number;
  csPerMinute: number;
  kda: number;
  goldPerMinute: number;
  damagePerMinute: number;
  deathsPerMinute: number;
  visionScore: number;
  win: boolean;
  queueId?: number;
  teamId?: number;
};

const roundTo = (value: number, decimals = 2): number => Number(value.toFixed(decimals));

export function calculateMatchMetrics(input: MatchMetricsInput): MatchMetrics {
  const minutes = Math.max(input.gameDuration / 60, 1);

  return {
    championId: input.championId,
    csPerMinute: roundTo(input.totalMinionsKilled / minutes),
    kda: roundTo((input.kills + input.assists) / Math.max(input.deaths, 1), 2),
    goldPerMinute: roundTo(input.goldEarned / minutes),
    damagePerMinute: roundTo(input.damageDealtToChampions / minutes),
    deathsPerMinute: roundTo(input.deaths / minutes, 2),
    visionScore: input.visionScore,
    win: input.win,
    queueId: input.queueId,
    teamId: input.teamId,
  };
}

export function buildCoachPrompt(matches: Array<Pick<MatchMetrics, "championId" | "csPerMinute" | "kda" | "goldPerMinute" | "damagePerMinute" | "deathsPerMinute" | "visionScore" | "win">>): string {
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

  const averageCs = average(matches.map((match) => match.csPerMinute));
  const averageKda = average(matches.map((match) => match.kda));
  const averageGold = average(matches.map((match) => match.goldPerMinute));
  const averageDeaths = average(matches.map((match) => match.deathsPerMinute));
  const worstCs = matches.reduce((lowest, current) => (current.csPerMinute < lowest.csPerMinute ? current : lowest), matches[0] ?? {
    championId: 0,
    csPerMinute: Number.POSITIVE_INFINITY,
    kda: 0,
    goldPerMinute: 0,
    damagePerMinute: 0,
    deathsPerMinute: 0,
    visionScore: 0,
    win: false,
  });

  const focus =
    worstCs.csPerMinute === Number.POSITIVE_INFINITY
      ? "Keep your early-game pressure and last-hit discipline consistent."
      : `Your main priority is farming: your CS/min is ${worstCs.csPerMinute.toFixed(1)}, which is below your usual pace. Focus on better last-hitting and lane pressure.`;

  return [
    "League of Legends coaching",
    "You are a concise coach. Review the recent matches and return a brief prioritized summary.",
    `Average CS/min: ${averageCs.toFixed(1)} | Average KDA: ${averageKda.toFixed(2)} | Average gold/min: ${averageGold.toFixed(0)} | Average deaths/min: ${averageDeaths.toFixed(2)}`,
    `Priority: ${focus}`,
    "2 concrete improvements:",
    "1) Improve lane consistency by securing more last hits and reducing dead time in lane.",
    "2) Reduce risky fights and improve vision control to avoid feeding patterns and reduce death pressure.",
    "Keep the tone direct, coach-like, and action-focused."
  ].join("\n");
}
