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

function riotRequestHeaders(): HeadersInit {
  const apiKey = process.env.RIOT_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not configured");
  }

  return {
    Accept: "application/json",
    "X-Riot-Token": apiKey,
  };
}

async function riotGet<T>(url: string, errorLabel: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: riotRequestHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Riot API key is invalid or expired. Generate a new development key at developer.riotgames.com");
    }

    const errorText = await response.text();
    throw new Error(`${errorLabel}: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

export function parseRiotId(riotId: string): { gameName: string; tagLine: string } {
  const [gameName, tagLine = "global"] = riotId.trim().split("#");

  if (!gameName || !tagLine) {
    throw new Error("Riot ID must follow the format name#tag");
  }

  return { gameName, tagLine };
}

export async function fetchAccountByRiotId(riotId: string): Promise<RiotAccount> {
  const { gameName, tagLine } = parseRiotId(riotId);
  return riotGet<RiotAccount>(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    "Riot account lookup failed"
  );
}

export async function fetchMatchIdsByPuuid(puuid: string, count = 5): Promise<string[]> {
  return riotGet<string[]>(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`,
    "Riot match list fetch failed"
  );
}

export async function fetchMatchById(matchId: string): Promise<RiotMatchSummary> {
  return riotGet<RiotMatchSummary>(
    `https://americas.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
    "Riot match fetch failed"
  );
}
