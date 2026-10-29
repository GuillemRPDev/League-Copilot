import styles from "./PlayerSummary.module.css";

type PlayerSummaryProps = {
  account: {
    gameName: string;
    tagLine: string;
  } | null;
};

export function PlayerSummary({ account }: PlayerSummaryProps) {
  if (!account) return null;

  return (
    <section aria-labelledby="player-heading" className={styles.summary}>
      <h2 className={styles.heading} id="player-heading">Player</h2>
      <p className={styles.riotId}>{account.gameName}#{account.tagLine}</p>
    </section>
  );
}