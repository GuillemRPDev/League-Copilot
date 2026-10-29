"use client";

import { useState, type FormEvent } from "react";

import styles from "./RiotIdForm.module.css";

type RiotIdFormProps = {
  loading: boolean;
  onSubmit: (riotId: string) => void;
};

export function RiotIdForm({ loading, onSubmit }: RiotIdFormProps) {
  const [riotId, setRiotId] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(riotId.trim());
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        aria-label="Riot ID"
        autoComplete="off"
        className={styles.input}
        placeholder="PlayerName#TAG"
        required
        type="text"
        value={riotId}
        onChange={(event) => setRiotId(event.target.value)}
      />
      <button className={styles.button} disabled={loading} type="submit">
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}