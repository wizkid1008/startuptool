"use client";

import { useState } from "react";
import {
  costScale,
  effortScale,
  estimateConfidenceScale,
  timeScale,
  type Scale
} from "@/lib/smeat/effort";

type SaveState = "idle" | "saving" | "saved" | "error";

const FIELDS = [
  ["effort_score", "Effort", effortScale],
  ["time_score", "Time", timeScale],
  ["cost_score", "Cost", costScale],
  ["estimate_confidence", "Confidence", estimateConfidenceScale]
] as const;

/**
 * The four estimates, editable inline on the Plan page.
 *
 * These used to sit inside the assessment panels, where they were mixed in
 * with judging what is true. They belong where the prioritising happens.
 * Saves on change rather than behind a button, like the discovery answers.
 */
export function EstimateRow({
  scoreId,
  maturity,
  impact,
  effort,
  time,
  cost,
  confidence
}: {
  scoreId: string;
  maturity: number;
  impact: number;
  effort: number | null;
  time: number | null;
  cost: number | null;
  confidence: number | null;
}) {
  const [values, setValues] = useState<Record<string, number | null>>({
    effort_score: effort,
    time_score: time,
    cost_score: cost,
    estimate_confidence: confidence
  });
  const [save, setSave] = useState<SaveState>("idle");

  async function persist(next: Record<string, number | null>) {
    setSave("saving");

    const body = new FormData();
    body.set("score_id", scoreId);
    // Maturity and impact are unchanged here, but the endpoint requires them.
    body.set("maturity_score", String(maturity));
    body.set("impact_score", String(impact));
    for (const [name] of FIELDS) {
      body.set(name, next[name] === null ? "" : String(next[name]));
    }

    try {
      const response = await fetch("/api/scores/update", {
        method: "POST",
        headers: { accept: "application/json" },
        body
      });
      if (!response.ok) throw new Error("save failed");
      setSave("saved");
      setTimeout(() => setSave("idle"), 1500);
    } catch {
      setSave("error");
    }
  }

  return (
    <>
      {FIELDS.map(([name, label, scale]) => (
        <td key={name}>
          <select
            aria-label={label}
            value={values[name] ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              const next = { ...values, [name]: raw === "" ? null : Number(raw) };
              setValues(next);
              void persist(next);
            }}
          >
            <option value="">—</option>
            {[1, 2, 3, 4].map((level) => (
              <option key={level} value={level}>
                {level} · {(scale as Scale)[level as 1 | 2 | 3 | 4].label}
              </option>
            ))}
          </select>
        </td>
      ))}
      <td className="nowrap">
        {save === "saving" ? <span className="hint">Saving…</span> : null}
        {save === "saved" ? <span className="pill good">Saved</span> : null}
        {save === "error" ? <span className="pill bad">Not saved</span> : null}
      </td>
    </>
  );
}
