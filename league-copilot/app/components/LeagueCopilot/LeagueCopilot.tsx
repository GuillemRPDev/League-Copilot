"use client";

import { useState } from "react";

import type { MatchMetrics } from "@/lib/metrics";
import type { RiotRoutingRegion } from "@/lib/riot";
import { CoachFeedback } from "../CoachFeedback/CoachFeedback";
import { ErrorNotice } from "../ErrorNotice/ErrorNotice";
import { MatchList } from "../MatchList/MatchList";
import { PageHeader } from "../PageHeader/PageHeader";
import { PlayerSummary } from "../PlayerSummary/PlayerSummary";
import { RiotIdForm } from "../RiotIdForm/RiotIdForm";
import styles from "./LeagueCopilot.module.css";

type RiotAccount = {
  gameName: string;
  tagLine: string;
  puuid: string;
};

type RiotApiResponse = {
  account: RiotAccount;
  matches: MatchMetrics[];
};

type CoachApiResponse = {
  feedback: string;
};

export function LeagueCopilot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [matches, setMatches] = useState<MatchMetrics[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const analyzeRiotId = async (riotId: string, region: RiotRoutingRegion) => {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const riotResponse = await fetch("/api/riot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId, count: 5, region }),
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
    <main className={styles.page}>
      <div className={styles.content}>
        <PageHeader />
        <RiotIdForm loading={loading} onSubmit={analyzeRiotId} />
        <ErrorNotice message={error} />
        <PlayerSummary account={account} />
        <MatchList matches={matches} />
        <CoachFeedback feedback={feedback} />
      </div>
    </main>
  );
}