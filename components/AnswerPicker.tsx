"use client";

import { useEffect, useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * One discovery question: pick a level, write detail, or both.
 *
 * Saves on selection and on blur rather than behind a button — there are 90 of
 * these, and a Save press per answer makes the page unusable. The API still
 * redirects for a plain form post, so this degrades to a working form without
 * JavaScript.
 */
export function AnswerPicker({
  assessmentId,
  dimensionKey,
  subdimensionKey,
  questionId,
  prompt,
  listenFor,
  initialLevel,
  initialAnswer,
  suggestedLevel,
  status
}: {
  assessmentId: string;
  dimensionKey: string;
  subdimensionKey: string;
  questionId: string;
  prompt: string;
  listenFor: Record<1 | 2 | 3 | 4, string>;
  initialLevel: number | null;
  initialAnswer: string;
  suggestedLevel: number | null;
  status: string;
}) {
  const [level, setLevel] = useState<number | null>(initialLevel);
  const [answer, setAnswer] = useState(initialAnswer);
  const [save, setSave] = useState<SaveState>("idle");
  const lastSaved = useRef({ level: initialLevel, answer: initialAnswer });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function persist(nextLevel: number | null, nextAnswer: string) {
    if (nextLevel === lastSaved.current.level && nextAnswer === lastSaved.current.answer) {
      return;
    }

    setSave("saving");
    const body = new FormData();
    body.set("assessment_id", assessmentId);
    body.set("dimension_key", dimensionKey);
    body.set("subdimension_key", subdimensionKey);
    body.set("question_id", questionId);
    body.set("status", "needs_input");
    body.set("answer", nextAnswer);
    if (nextLevel !== null) body.set("selected_level", String(nextLevel));

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { accept: "application/json" },
        body
      });

      if (!response.ok) throw new Error("save failed");

      lastSaved.current = { level: nextLevel, answer: nextAnswer };
      setSave("saved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSave("idle"), 1800);
    } catch {
      setSave("error");
    }
  }

  const resolved = level !== null || answer.trim().length > 0;

  return (
    <div className="qblock">
      <div className="between">
        <strong className="small">{prompt}</strong>
        <span className="row" style={{ gap: 8 }}>
          {save === "saving" ? <span className="hint">Saving…</span> : null}
          {save === "saved" ? <span className="pill good">Saved</span> : null}
          {save === "error" ? <span className="pill bad">Not saved</span> : null}
          {save === "idle" ? (
            <span className={resolved ? "pill good" : "pill warn"}>
              {resolved ? "Answered" : status === "not_applicable" ? "N/A" : "Needs input"}
            </span>
          ) : null}
        </span>
      </div>

      <div className="cuepick">
        {[1, 2, 3, 4].map((value) => {
          const selected = level === value;
          return (
            <button
              type="button"
              key={value}
              className={`cue${selected ? " cue-on" : ""}`}
              aria-pressed={selected}
              onClick={() => {
                // Clicking the chosen level again clears it.
                const next = selected ? null : value;
                setLevel(next);
                void persist(next, answer);
              }}
            >
              <span className="cue-num">{selected ? "✓" : value}</span>
              <span className="cue-text">
                {listenFor[value as 1 | 2 | 3 | 4]}
                {suggestedLevel === value ? (
                  <span className="pill ghost" style={{ marginLeft: 6 }}>
                    Agent&rsquo;s read
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onBlur={() => void persist(level, answer)}
        placeholder="Add detail, or leave blank — picking a level above is enough"
        style={{ minHeight: 52 }}
      />
    </div>
  );
}
