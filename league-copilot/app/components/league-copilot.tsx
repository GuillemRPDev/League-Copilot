"use client";

import { useState } from "react";

import type { MatchMetrics } from "@/lib/metrics";

type RiotApiResponse = {
  account: {
    gameName: string;
    tagLine: string;
    puuid: string;
  };
  matches: MatchMetrics[];
};

type CoachApiResponse = {
  feedback: string;
};

export function LeagueCopilot() {
  const [riotId, setRiotId] = useState("" );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RiotApiResponse["account"] | null>(null);
  const [matches, setMatches] = useState<MatchMetrics[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const riotResponse = await fetch("/api/riot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId, count: 5 }),
      });

      const riotJson = (await riotResponse.json()) as RiotApiResponse & { error?: string };

      if (!riotResponse.ok || !riotJson.account || !riotJson.matches?.length) {
        throw new Error(riotJson.error ?? "No matches found for this Riot ID.");
      }

      setAccount(riotJson.account);
      setMatches(riotJson.matches);

      const coachResponse = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches: riotJson.matches }),
      });

      const coachJson = (await coachResponse.json()) as CoachApiResponse & { error?: string };

      if (!coachResponse.ok) {
        throw new Error(coachJson.error ?? "Unable to generate coach feedback.");
      }

      setFeedback(coachJson.feedback);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 text-slate-100">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">League Copilot</p>
        <h1 className="mt-3 text-3xl font-bold text-white">AI coaching for your recent matches</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 md:flex-row">
        <input
          type="text"
          value={riotId}
          onChange={(event) => setRiotId(event.target.value)}
          placeholder="PlayerName#TAG"
          className="flex-1 rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-base text-white outline-none ring-0 transition focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error ? (
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">{error}</div>
      ) : null}

      {account ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Player</h2>
          <p className="mt-2 text-cyan-300">
            {account.gameName}#{account.tagLine}
          </p>
        </section>
      ) : null}

      {matches.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match, index) => (
            <article key={`${match.championId}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Match {index + 1}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>Champion ID: {match.championId}</p>
                <p>CS/min: {match.csPerMinute}</p>
                <p>KDA: {match.kda}</p>
                <p>Gold/min: {match.goldPerMinute}</p>
                <p>Damage/min: {match.damagePerMinute}</p>
                <p>Deaths/min: {match.deathsPerMinute}</p>
                <p>Vision: {match.visionScore}</p>
                <p>Result: {match.win ? "Win" : "Loss"}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {feedback ? (
        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
          <h2 className="text-xl font-semibold text-white">Coach feedback</h2>
          <p className="mt-3 whitespace-pre-line text-slate-100">{feedback}</p>
        </section>
      ) : null}
    </main>
  );
}
