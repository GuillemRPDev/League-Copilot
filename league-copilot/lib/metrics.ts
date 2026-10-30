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
      ? "Mantén una presión constante en línea y mejora los últimos golpes a los súbditos."
      : `Tu prioridad principal es mejorar el farmeo de súbditos: tu CS/min más bajo es ${worstCs.csPerMinute.toFixed(1)}. Practica los últimos golpes y evita perder oleadas por retiradas mal sincronizadas.`;

  return [
    "Coaching de League of Legends (MOBA)",
    "En este contexto, CS significa súbditos enemigos eliminados con último golpe y farmeo significa conseguir oro de súbditos. No hables de agricultura ni de otros juegos.",
    "Analiza las partidas recientes y responde exclusivamente en español.",
    `Promedios: CS/min ${averageCs.toFixed(1)} | KDA ${averageKda.toFixed(2)} | oro/min ${averageGold.toFixed(0)} | muertes/min ${averageDeaths.toFixed(2)}`,
    `Prioridad principal: ${focus}`,
    "Da exactamente dos acciones breves, específicas de League of Legends y que el jugador pueda practicar en su próxima partida.",
    "Incluye detalles observables de línea, oleadas, últimos golpes o retiradas; evita consejos vagos y no inventes mecánicas.",
    "Formato: Prioridad, Acción 1, Acción 2. Sin introducción ni razonamiento interno."
  ].join("\n");
}

export function buildFallbackFeedback(matches: MatchMetrics[]): string {
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const averageCs = average(matches.map((match) => match.csPerMinute));
  const averageDeaths = average(matches.map((match) => match.deathsPerMinute));
  const averageVision = average(matches.map((match) => match.visionScore));
  const wins = matches.filter((match) => match.win).length;

  const priority = averageCs < 5
    ? "Prioridad: mejorar el farmeo durante los primeros minutos; busca superar 5 CS/min de forma consistente."
    : averageDeaths > 0.45
      ? "Prioridad: reducir muertes evitables; antes de pelear, comprueba visión y la posición del jungla enemigo."
      : "Prioridad: mantener la consistencia y convertir tu ventaja de recursos en objetivos.";

  return [
    "Análisis automático de tus últimas partidas",
    `Resultado: ${wins}/${matches.length} victorias | CS/min: ${averageCs.toFixed(1)} | Muertes/min: ${averageDeaths.toFixed(2)} | Visión: ${averageVision.toFixed(1)}`,
    priority,
    "Dos acciones concretas:",
    "1) Revisa los 10 primeros minutos y anota cada oleada perdida sin presión enemiga.",
    "2) Coloca visión antes de avanzar y transforma cada prioridad de línea en placas, torres o dragón.",
    "Modo sin proveedor externo: configura Ollama o Anthropic para feedback generado por un modelo."
  ].join("\n");
}
