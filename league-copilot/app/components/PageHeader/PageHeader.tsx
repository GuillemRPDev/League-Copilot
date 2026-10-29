import styles from "./PageHeader.module.css";

export function PageHeader() {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>League Copilot</p>
      <h1 className={styles.title}>AI coaching for your recent matches</h1>
    </header>
  );
}