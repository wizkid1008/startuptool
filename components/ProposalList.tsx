"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type Proposal = {
  id: string;
  title: string;
  subdimensionLabel: string;
  effortLabel: string | null;
  rationale: string | null;
};

type Verdict = "accept" | "delete";

/** How long a discard can be taken back before it is written. */
const UNDO_MS = 6000;

function post(id: string, verdict: Verdict, keepalive = false) {
  const body = new FormData();
  body.set("intent", verdict);
  body.set("action_id", id);

  return fetch("/api/actions", {
    method: "POST",
    headers: { accept: "application/json" },
    body,
    keepalive
  });
}

/**
 * Triage for agent proposals.
 *
 * Every one of these is a decision and there can be thirty of them. A form
 * post per card meant a full navigation, a scroll back to the top and a
 * re-read of the ones already dealt with — the same objection as pressing Save
 * after each discovery answer. So a click settles the card here and the write
 * goes out behind it.
 *
 * Discard deletes, and proposals only regenerate once a day, so a misclick
 * would cost a day. It waits out an undo window first; navigating away inside
 * that window flushes it, and a failed flush just leaves the proposal where it
 * was, which is the safe way to lose.
 */
export function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();
  const [settled, setSettled] = useState<Record<string, Verdict>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});

  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const refresh = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    // Accepted proposals belong in the Actions table below, and the stage
    // counts move with them. Debounced so working quickly down the list does
    // not fire a round trip per click.
    if (refresh.current) clearTimeout(refresh.current);
    refresh.current = setTimeout(() => router.refresh(), 1500);
  }, [router]);

  const fail = useCallback((id: string) => {
    setSettled((prior) => {
      const next = { ...prior };
      delete next[id];
      return next;
    });
    setFailed((prior) => ({ ...prior, [id]: "Not saved — try again." }));
  }, []);

  useEffect(() => {
    const pending = timers.current;

    return () => {
      // Leaving the page commits whatever the undo window was still holding.
      for (const [id, timer] of pending) {
        clearTimeout(timer);
        void post(id, "delete", true);
      }
      pending.clear();
      if (refresh.current) clearTimeout(refresh.current);
    };
  }, []);

  function accept(id: string) {
    setSettled((prior) => ({ ...prior, [id]: "accept" }));
    setFailed((prior) => {
      const next = { ...prior };
      delete next[id];
      return next;
    });

    void post(id, "accept")
      .then((response) => {
        if (!response.ok) throw new Error("write failed");
        scheduleRefresh();
      })
      .catch(() => fail(id));
  }

  function discard(id: string) {
    setSettled((prior) => ({ ...prior, [id]: "delete" }));

    const timer = setTimeout(() => {
      timers.current.delete(id);
      void post(id, "delete")
        .then((response) => {
          if (!response.ok) throw new Error("write failed");
        })
        .catch(() => fail(id));
    }, UNDO_MS);

    timers.current.set(id, timer);
  }

  function undo(id: string) {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);

    setSettled((prior) => {
      const next = { ...prior };
      delete next[id];
      return next;
    });
  }

  const verdicts = Object.values(settled);
  const accepted = verdicts.filter((verdict) => verdict === "accept").length;
  const discarded = verdicts.length - accepted;
  const left = proposals.length - verdicts.length;

  return (
    <>
      {verdicts.length > 0 ? (
        <p className="hint" role="status" style={{ marginBottom: 12 }}>
          {accepted > 0 ? `${accepted} accepted` : null}
          {accepted > 0 && discarded > 0 ? " · " : null}
          {discarded > 0 ? `${discarded} discarded` : null}
          {left > 0 ? ` · ${left} left` : " · nothing left to review"}
        </p>
      ) : null}

      <div className="proposals">
        {proposals.map((proposal) => {
          const verdict = settled[proposal.id];

          if (verdict) {
            return (
              <div className="proposal settled" key={proposal.id}>
                <span className="proposal-body">
                  <span className={verdict === "accept" ? "pill good" : "pill ghost"}>
                    {verdict === "accept" ? "Accepted" : "Discarded"}
                  </span>
                  <span className="muted small">{proposal.title}</span>
                </span>
                {verdict === "delete" ? (
                  <div className="proposal-verdict">
                    <button type="button" className="quiet small" onClick={() => undo(proposal.id)}>
                      Undo
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <article className="proposal" key={proposal.id}>
              <div className="proposal-body">
                <strong>{proposal.title}</strong>
                <div className="hint">
                  {proposal.subdimensionLabel}
                  {proposal.effortLabel ? ` · ${proposal.effortLabel}` : ""}
                </div>
                {proposal.rationale ? (
                  <p className="small muted" style={{ margin: "8px 0 0" }}>
                    {proposal.rationale}
                  </p>
                ) : null}
                {failed[proposal.id] ? (
                  <p className="proposal-error">{failed[proposal.id]}</p>
                ) : null}
              </div>

              <div className="proposal-verdict">
                <button type="button" onClick={() => accept(proposal.id)}>
                  Accept
                </button>
                <button
                  type="button"
                  className="quiet small"
                  onClick={() => discard(proposal.id)}
                >
                  Discard
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
