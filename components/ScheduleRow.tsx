"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * The start and end dates for one action.
 *
 * Saves on change, like every other field in the tool. A refresh follows so
 * the Gantt above redraws — the bar positions are computed server-side from
 * the whole set, so a local edit cannot move one bar without recomputing the
 * window every other bar sits in.
 */
export function ScheduleRow({
  actionId,
  start,
  end
}: {
  actionId: string;
  start: string | null;
  end: string | null;
}) {
  const router = useRouter();
  const [dates, setDates] = useState({ start: start ?? "", end: end ?? "" });
  const [save, setSave] = useState<SaveState>("idle");

  async function persist(next: { start: string; end: string }) {
    setSave("saving");

    const body = new FormData();
    body.set("intent", "set");
    body.set("action_id", actionId);
    body.set("start_date", next.start);
    body.set("end_date", next.end);

    try {
      const response = await fetch("/api/actions/schedule", {
        method: "POST",
        headers: { accept: "application/json" },
        body
      });

      if (!response.ok) throw new Error("save failed");

      setSave("saved");
      router.refresh();
    } catch {
      setSave("error");
    }
  }

  function change(field: "start" | "end", value: string) {
    const next = { ...dates, [field]: value };
    setDates(next);
    // An end before a start is rejected by a check constraint, so do not send
    // a half-edited pair that is guaranteed to fail.
    if (next.start && next.end && next.end < next.start) {
      setSave("error");
      return;
    }
    void persist(next);
  }

  return (
    <span className="row" style={{ gap: 4 }}>
      <input
        type="date"
        aria-label="Start date"
        value={dates.start}
        onChange={(event) => change("start", event.target.value)}
      />
      <input
        type="date"
        aria-label="End date"
        value={dates.end}
        onChange={(event) => change("end", event.target.value)}
      />
      {save === "saving" ? <span className="hint">…</span> : null}
      {save === "error" ? <span className="pill bad">Check dates</span> : null}
    </span>
  );
}
