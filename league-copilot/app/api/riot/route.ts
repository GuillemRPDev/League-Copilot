import { NextRequest, NextResponse } from "next/server";

import { calculateMatchMetrics } from "@/lib/metrics";
import {
  fetchAccountByRiotId,
  fetchMatchById,
  fetchMatchIdsByPuuid,
  isRiotRoutingRegion,
} from "@/lib/riot";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { riotId?: string; count?: number; region?: unknown };
    const riotId = body.riotId?.trim();
    const count = Math.min(Math.max(Number(body.count ?? 5), 1), 10);
    const region = body.region ?? "americas";

    if (!riotId) {
      return NextResponse.json({ error: "riotId is required" }, { status: 400 });
    }

    if (!isRiotRoutingRegion(region)) {
      return NextResponse.json({ error: "Invalid Riot routing region" }, { status: 400 });
    }

    const account = await fetchAccountByRiotId(riotId, region);
    const matchIds = await fetchMatchIdsByPuuid(account.puuid, count, region);
    const matches = await Promise.all(matchIds.map(async (matchId) => {
      const match = await fetchMatchById(matchId, region);
      const participant = match.info.participants.find((entry) => entry.puuid === account.puuid);

      if (!participant) {
        return null;
      }

      return calculateMatchMetrics({
        gameDuration: match.info.gameDuration,
        championId: participant.championId,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        totalMinionsKilled: participant.totalMinionsKilled,
        goldEarned: participant.goldEarned,
        damageDealtToChampions: participant.damageDealtToChampions,
        damageTaken: participant.damageTaken,
        visionScore: participant.visionScore,
        wardsPlaced: participant.wardsPlaced,
        longestTimeSpentLiving: participant.longestTimeSpentLiving,
        teamId: participant.teamId,
        win: participant.win,
        queueId: match.info.queueId,
      });
    }));

    return NextResponse.json({
      account,
      matches: matches.filter(Boolean),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
