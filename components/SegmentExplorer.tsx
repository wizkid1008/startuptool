"use client";

import { useState } from "react";
import { priorityBand, priorityTone } from "@/lib/smeat/effort";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import {
  criticalityBand,
  criticalityTone,
  impactLabel,
  impactTone,
  maturityLabel,
  maturityTone,
  pillClass
} from "@/lib/smeat/presentation";
import { rubricFor } from "@/lib/smeat/rubric";
import {
  computeCriticalityScore,
  impactDefinitions,
  rollUpSegment
} from "@/lib/smeat/scoring";

type ScoreRow = {
  id: string;
  dimension_key: string;
  subdimension_key: string;
  maturity_score: number;
  impact_score: number;
  criticality_score?: number;
  effort_score?: number | null;
  time_score?: number | null;
  cost_score?: number | null;
  estimate_confidence?: number | null;
  priority_score?: number | null;
  rationale?: string | null;
  reviewer_note?: string | null;
  source?: string | null;
};

type EvidenceRow = {
  id: string;
  assessment_score_id: string | null;
  evidence_type: string;
  title: string | null;
  url: string | null;
  excerpt: string | null;
};

type ActionRow = {
  id: string;
  assessment_score_id: string | null;
  // Kept so an action survives a re-score, which nulls assessment_score_id.
  dimension_key: string | null;
  subdimension_key: string | null;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: string;
};

const SOURCE_LABEL: Record<string, string> = {
  ai: "AI",
  manual: "Edited",
  import: "Imported"
};

const ACTION_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  dropped: "Dropped"
};

function heatClass(criticality: number | null) {
  if (criticality === null) return "heat-none";
  if (criticality >= 12) return "heat-4";
  if (criticality >= 8) return "heat-3";
  if (criticality >= 4) return "heat-2";
  return "heat-1";
}

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Segments first, subdimensions on demand.
 *
 * Thirty expandable rows at once is too much to scan. The heat map doubles as
 * the navigation: pick a segment and only its subdimensions render. Evidence
 * and actions sit inside each subdimension rather than in separate panels, so
 * everything about one judgment is in one place.
 */
export function SegmentExplorer({
  assessmentId,
  scores,
  evidence = [],
  actions = []
}: {
  assessmentId: string;
  scores: ScoreRow[];
  evidence?: EvidenceRow[];
  actions?: ActionRow[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const byKey = new Map(
    scores.map((score) => [`${score.dimension_key}:${score.subdimension_key}`, score])
  );

  const evidenceByScore = new Map<string, EvidenceRow[]>();
  for (const item of evidence) {
    if (!item.assessment_score_id) continue;
    evidenceByScore.set(item.assessment_score_id, [
      ...(evidenceByScore.get(item.assessment_score_id) ?? []),
      item
    ]);
  }

  // Re-scoring deletes and recreates every score row, and the foreign key
  // nulls assessment_score_id when it goes. Keying only on that id made every
  // action vanish from the page after a re-run, even though the rows survived.
  // The subdimension keys are stored for exactly this reason.
  const actionsByScore = new Map<string, ActionRow[]>();
  const actionsBySubdimension = new Map<string, ActionRow[]>();
  for (const action of actions) {
    if (action.assessment_score_id) {
      actionsByScore.set(action.assessment_score_id, [
        ...(actionsByScore.get(action.assessment_score_id) ?? []),
        action
      ]);
    } else if (action.dimension_key && action.subdimension_key) {
      const key = `${action.dimension_key}:${action.subdimension_key}`;
      actionsBySubdimension.set(key, [...(actionsBySubdimension.get(key) ?? []), action]);
    }
  }

  const dimension = SMEAT_DIMENSIONS.find((d) => d.key === selected) ?? null;

  return (
    <div className="stack">
      <div className="heatmap compact">
        {SMEAT_DIMENSIONS.map((d) => {
          const rows = scores.filter((score) => score.dimension_key === d.key);
          const rollup = rollUpSegment(rows);
          const active = selected === d.key;

          return (
            <button
              type="button"
              key={d.key}
              className={`heat ${heatClass(rollup.criticality)}${active ? " active" : ""}`}
              onClick={() => setSelected(active ? null : d.key)}
              aria-expanded={active}
            >
              <span className="heat-label">{d.label}</span>
              <span className="heat-value">
                {rollup.criticality === null ? "—" : rollup.criticality}
              </span>
              <span className="heat-sub">
                {rollup.maturity === null
                  ? `0 / ${d.subdimensions.length}`
                  : `M ${rollup.maturity.toFixed(1)} · I ${rollup.impact?.toFixed(1)}`}
              </span>
            </button>
          );
        })}
      </div>

      {!dimension ? (
        <p className="hint" style={{ textAlign: "center", padding: "10px 0" }}>
          Select a segment to review its subdimensions.
        </p>
      ) : (
        <div className="tablewrap">
          {dimension.subdimensions.map((subdimension) => {
            const score = byKey.get(`${dimension.key}:${subdimension.key}`);
            const rubric = rubricFor(dimension.key, subdimension.key);

            if (!score) {
              return (
                <div className="scorerow-empty" key={subdimension.key}>
                  <span>{subdimension.label}</span>
                  <span className="muted small">Not scored</span>
                </div>
              );
            }

            const criticality = Number(
              score.criticality_score ??
                computeCriticalityScore(score.maturity_score, score.impact_score)
            );
            const scoreEvidence = evidenceByScore.get(score.id) ?? [];
            const scoreActions = [
              ...(actionsByScore.get(score.id) ?? []),
              // Orphaned by a re-score, re-attached by subdimension.
              ...(actionsBySubdimension.get(`${dimension.key}:${subdimension.key}`) ?? [])
            ];

            return (
              // Same exclusive grouping as discovery: one subdimension open at
              // a time, rather than a page of expanded rubric cards.
              <details key={subdimension.key} name="review-subdimension">
                <summary>
                  <span className="row" style={{ gap: 6, minWidth: 0 }}>
                    <strong>{subdimension.label}</strong>
                    {score.source ? (
                      <span className={`pill ${score.source === "manual" ? "info" : "ghost"}`}>
                        {SOURCE_LABEL[score.source] ?? score.source}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidesm">
                    <span className={pillClass(maturityTone(score.maturity_score))}>
                      {score.maturity_score} {maturityLabel(score.maturity_score)}
                    </span>
                  </span>
                  <span className="hidesm">
                    <span className={pillClass(impactTone(score.impact_score))}>
                      {score.impact_score} {impactLabel(score.impact_score)}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 5 }}>
                    <span className={pillClass(criticalityTone(criticality))}>{criticality}</span>
                    {score.priority_score === null || score.priority_score === undefined ? null : (
                      <span className={`pill ${priorityTone(Number(score.priority_score))}`}>
                        P{Number(score.priority_score)}
                      </span>
                    )}
                  </span>
                  <span className="chev" aria-hidden="true">
                    ▶
                  </span>
                </summary>

                <div className="expand">
                  <form method="post" action="/api/scores/update">
                    <input type="hidden" name="score_id" value={score.id} />

                    <div className="microlabel">Maturity</div>
                    <div className="levels">
                      {[1, 2, 3, 4].map((level) => {
                        const bullets =
                          rubric?.levels.find((l) => l.level === level)?.bullets ?? [];
                        return (
                          <label className="lvl" key={level}>
                            <input
                              type="radio"
                              name="maturity_score"
                              value={level}
                              defaultChecked={level === score.maturity_score}
                            />
                            <span className="lvlnum">
                              {level} · {maturityLabel(level)}
                            </span>
                            {bullets.length > 0 ? (
                              <ul>
                                {bullets.map((bullet, index) => (
                                  <li key={index}>{bullet}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="hint">No definition in the workbook.</p>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <div className="microlabel" style={{ marginTop: 14 }}>
                      Impact
                    </div>
                    <div className="levels impact">
                      {[4, 3, 2, 1].map((level) => (
                        <label className="lvl" key={level}>
                          <input
                            type="radio"
                            name="impact_score"
                            value={level}
                            defaultChecked={level === score.impact_score}
                          />
                          <span className="lvlnum">
                            {level} · {impactLabel(level)}
                          </span>
                          <p>{impactDefinitions[level]}</p>
                        </label>
                      ))}
                    </div>

                    {/* Effort, time, cost and confidence live on the Plan
                        page. This view is for judging what is true; those are
                        for deciding what to do about it. They are carried as
                        hidden fields so saving here does not clear them. */}
                    <input
                      type="hidden"
                      name="effort_score"
                      value={score.effort_score ?? ""}
                    />
                    <input type="hidden" name="time_score" value={score.time_score ?? ""} />
                    <input type="hidden" name="cost_score" value={score.cost_score ?? ""} />
                    <input
                      type="hidden"
                      name="estimate_confidence"
                      value={score.estimate_confidence ?? ""}
                    />

                    {score.rationale ? (
                      <div className="rationale">
                        <span className="microlabel">Agent rationale</span>
                        <p className="small muted">{score.rationale}</p>
                      </div>
                    ) : null}

                    {/* Evidence lives with the judgment it supports, rather
                        than in a separate panel further down the page. */}
                    {scoreEvidence.length > 0 ? (
                      <div className="rationale">
                        <span className="microlabel">Evidence</span>
                        {scoreEvidence.map((item) => {
                          const url = safeUrl(item.url);
                          return (
                            <p className="small muted" key={item.id}>
                              <span className="pill ghost">{item.evidence_type}</span>{" "}
                              {item.title ? <b>{item.title}. </b> : null}
                              {item.excerpt}
                              {url ? (
                                <>
                                  {" "}
                                  <a href={url} target="_blank" rel="noopener noreferrer">
                                    source
                                  </a>
                                </>
                              ) : null}
                            </p>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="field" style={{ marginTop: 12 }}>
                      <label htmlFor={`note-${score.id}`}>Reviewer note</label>
                      <textarea
                        id={`note-${score.id}`}
                        name="reviewer_note"
                        defaultValue={score.reviewer_note ?? ""}
                        placeholder="What you changed and why."
                        style={{ minHeight: 56 }}
                      />
                    </div>

                    <button type="submit" style={{ marginTop: 10 }}>
                      Save
                    </button>
                  </form>

                  {rubric && rubric.questions.length > 0 ? (
                    <div className="questions">
                      <span className="microlabel">Questions to ask</span>
                      <ul>
                        {rubric.questions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="questions">
                    <span className="microlabel">Actions</span>
                    {scoreActions.map((action) => (
                      <div className="actionrow" key={action.id}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{action.title}</div>
                          <div className="hint">
                            {[action.owner, action.due_date ? `due ${action.due_date}` : null]
                              .filter(Boolean)
                              .join(" · ") || "No owner"}
                          </div>
                        </div>
                        <form method="post" action="/api/actions" className="row">
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="action_id" value={action.id} />
                          <select name="status" defaultValue={action.status}>
                            {Object.entries(ACTION_STATUS_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button className="secondary small" type="submit">
                            Set
                          </button>
                        </form>
                        <form method="post" action="/api/actions">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="action_id" value={action.id} />
                          <button className="quiet small" type="submit" aria-label="Delete">
                            ×
                          </button>
                        </form>
                      </div>
                    ))}

                    <form method="post" action="/api/actions" className="actionform">
                      <input type="hidden" name="intent" value="create" />
                      <input type="hidden" name="assessment_id" value={assessmentId} />
                      <input type="hidden" name="assessment_score_id" value={score.id} />
                      <input type="hidden" name="dimension_key" value={dimension.key} />
                      <input type="hidden" name="subdimension_key" value={subdimension.key} />
                      <input name="title" placeholder="What needs doing" required />
                      <input name="owner" placeholder="Owner" />
                      <input name="due_date" type="date" aria-label="Due date" />
                      <button className="secondary" type="submit">
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
