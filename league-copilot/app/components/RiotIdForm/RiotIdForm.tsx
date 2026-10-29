"use client";

import { useState, type FormEvent } from "react";

import type { RiotRoutingRegion } from "@/lib/riot";
import styles from "./RiotIdForm.module.css";

type RiotIdFormProps = {
  loading: boolean;
  onSubmit: (riotId: string, region: RiotRoutingRegion) => void;
};

export function RiotIdForm({ loading, onSubmit }: RiotIdFormProps) {
  const [riotId, setRiotId] = useState("");
  const [region, setRegion] = useState<RiotRoutingRegion>("americas");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(riotId.trim(), region);
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
      <label className={styles.regionField}>
        <span className={styles.regionLabel}>Region</span>
        <select
          className={styles.select}
          value={region}
          onChange={(event) => setRegion(event.target.value as RiotRoutingRegion)}
        >
          <option value="americas">Americas</option>
          <option value="europe">Europe</option>
          <option value="asia">Asia</option>
          <option value="sea">Southeast Asia</option>
        </select>
      </label>
      <button className={styles.button} disabled={loading} type="submit">
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}