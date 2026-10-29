import type { MatchMetrics } from "@/lib/metrics";
import styles from "./MatchList.module.css";

type MatchListProps = {
  matches: MatchMetrics[];
};

export function MatchList({ matches }: MatchListProps) {
  if (!matches.length) return null;

  return (
    <section aria-label="Recent matches" className={styles.list}>
      {matches.map((match, index) => (
        <article className={styles.match} key={`${match.championId}-${index}`}>
          <div className={styles.matchHeader}>
            <p className={styles.label}>Match {index + 1}</p>
            <span className={match.win ? styles.win : styles.loss}>
              {match.win ? "Win" : "Loss"}
            </span>
          </div>
          <p className={styles.champion}>Champion ID: {match.championId}</p>
          <dl className={styles.metrics}>
            <div><dt>CS/min</dt><dd>{match.csPerMinute}</dd></div>
            <div><dt>KDA</dt><dd>{match.kda}</dd></div>
            <div><dt>Gold/min</dt><dd>{match.goldPerMinute}</dd></div>
            <div><dt>Damage/min</dt><dd>{match.damagePerMinute}</dd></div>
            <div><dt>Deaths/min</dt><dd>{match.deathsPerMinute}</dd></div>
            <div><dt>Vision</dt><dd>{match.visionScore}</dd></div>
          </dl>
        </article>
      ))}
    </section>
  );
}