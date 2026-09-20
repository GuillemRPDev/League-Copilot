export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export type RiotMatchSummary = {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameDuration: number;
    queueId: number;
    participants: RiotParticipant[];
    win: boolean;
  };
};

export type RiotParticipant = {
  puuid: string;
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
};

export function parseRiotId(riotId: string): { gameName: string; tagLine: string } {
  const [gameName, tagLine = "global"] = riotId.trim().split("#");

  if (!gameName || !tagLine) {
    throw new Error("Riot ID must follow the format name#tag");
  }

  return { gameName, tagLine };
}

export async function fetchAccountByRiotId(riotId: string): Promise<RiotAccount> {
  const { gameName, tagLine } = parseRiotId(riotId);
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not configured");
  }

  const response = await fetch(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`,
    { method: "GET", headers: { "Accept": "application/json" } }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Riot account lookup failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as RiotAccount;
}

export async function fetchMatchIdsByPuuid(puuid: string, count = 5): Promise<string[]> {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not configured");
  }

  const response = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}&api_key=${apiKey}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Riot match list fetch failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as string[];
}

export async function fetchMatchById(matchId: string): Promise<RiotMatchSummary> {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not configured");
  }

  const response = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}?api_key=${apiKey}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Riot match fetch failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as RiotMatchSummary;
}
