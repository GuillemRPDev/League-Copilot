import styles from "./CoachFeedback.module.css";

type CoachFeedbackProps = {
  feedback: string | null;
};

export function CoachFeedback({ feedback }: CoachFeedbackProps) {
  if (!feedback) return null;

  return (
    <section aria-labelledby="feedback-heading" className={styles.feedback}>
      <h2 className={styles.heading} id="feedback-heading">Coach feedback</h2>
      <p className={styles.text}>{feedback}</p>
    </section>
  );
}