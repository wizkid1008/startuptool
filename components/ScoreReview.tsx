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
import {
  costScale,
  effortScale,
  estimateConfidenceScale,
  priorityBand,
  priorityTone,
  timeScale
} from "@/lib/smeat/effort";
import { rubricFor } from "@/lib/smeat/rubric";
import { computeCriticalityScore, impactDefinitions } from "@/lib/smeat/scoring";

type ScoreRow = {
  id: string;
  dimension_key: string;
  subdimension_key: string;
  maturity_score: number;
  impact_score: number;
  criticality_score?: number;
  confidence?: number | null;
  rationale?: string | null;
  reviewer_note?: string | null;
  source?: string | null;
  effort_score?: number | null;
  time_score?: number | null;
  cost_score?: number | null;
  estimate_confidence?: number | null;
  priority_score?: number | null;
};

type ActionRow = {
  id: string;
  assessment_score_id: string | null;
  dimension_key: string | null;
  subdimension_key: string | null;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: string;
};

const ACTION_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  dropped: "Dropped"
};

const ACTION_STATUS_TONE: Record<string, string> = {
  open: "pill warn",
  in_progress: "pill info",
  done: "pill good",
  dropped: "pill ghost"
};

const SOURCE_LABEL: Record<string, string> = {
  ai: "AI",
  manual: "Edited",
  import: "Imported"
};

function sourceBadge(source?: string | null) {
  if (!source) return null;
  const tone = source === "manual" ? "info" : "ghost";
  return <span className={`pill ${tone}`}>{SOURCE_LABEL[source] ?? source}</span>;
}

/**
 * The score matrix, editable in place.
 *
 * Each subdimension expands to show all four maturity definitions from the
 * workbook rubric, so a reviewer chooses a rating while reading what it means
 * rather than guessing at a bare number. Everything is plain form posts —
 * `details`/`summary` handles disclosure and `:has(input:checked)` handles the
 * selected state, so no client JavaScript is involved.
 */
export function ScoreReview({
  assessmentId,
  scores,
  actions = []
}: {
  assessmentId: string;
  scores: ScoreRow[];
  actions?: ActionRow[];
}) {
  const byKey = new Map(
    scores.map((score) => [`${score.dimension_key}:${score.subdimension_key}`, score])
  );

  const actionsByScore = new Map<string, ActionRow[]>();
  for (const action of actions) {
    const key = action.assessment_score_id ?? `${action.dimension_key}:${action.subdimension_key}`;
    actionsByScore.set(key, [...(actionsByScore.get(key) ?? []), action]);
  }

  return (
    <div className="stack">
      {SMEAT_DIMENSIONS.map((dimension) => (
        <section key={dimension.key}>
          <div className="card-head">
            <h3>{dimension.label}</h3>
            <span className="microlabel">{dimension.subdimensions.length} subdimensions</span>
          </div>

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

              return (
                <details key={subdimension.key}>
                  <summary>
                    <span className="row" style={{ gap: 8, minWidth: 0 }}>
                      <strong>{subdimension.label}</strong>
                      {sourceBadge(score.source)}
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
                    <span className="row" style={{ gap: 6 }}>
                      <span className={pillClass(criticalityTone(criticality))}>
                        {criticality} {criticalityBand(criticality)}
                      </span>
                      {score.priority_score === null || score.priority_score === undefined ? null : (
                        <span className={`pill ${priorityTone(Number(score.priority_score))}`}>
                          P{Number(score.priority_score)}{" "}
                          {priorityBand(Number(score.priority_score))}
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

                      <div className="microlabel">Maturity — what each rating means</div>
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

                      <div className="microlabel" style={{ marginTop: 18 }}>
                        Impact — how much this matters
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

                      <div className="microlabel" style={{ marginTop: 18 }}>
                        Estimate — what it would take to move this up one level
                      </div>
                      <div className="estimates">
                        {(
                          [
                            ["effort_score", "Effort", effortScale, score.effort_score],
                            ["time_score", "Time", timeScale, score.time_score],
                            ["cost_score", "Cost", costScale, score.cost_score],
                            [
                              "estimate_confidence",
                              "Confidence",
                              estimateConfidenceScale,
                              score.estimate_confidence
                            ]
                          ] as const
                        ).map(([name, label, scale, value]) => (
                          <div className="field" key={name}>
                            <label htmlFor={`${name}-${score.id}`}>{label}</label>
                            <select
                              id={`${name}-${score.id}`}
                              name={name}
                              defaultValue={value ?? ""}
                            >
                              <option value="">Not estimated</option>
                              {[1, 2, 3, 4].map((level) => (
                                <option key={level} value={level}>
                                  {level} · {scale[level as 1 | 2 | 3 | 4].label}
                                </option>
                              ))}
                            </select>
                            <span className="hint">
                              {value
                                ? scale[value as 1 | 2 | 3 | 4].definition
                                : scale[1].definition}
                            </span>
                          </div>
                        ))}
                      </div>

                      {score.rationale ? (
                        <div className="rationale">
                          <span className="microlabel">Agent rationale</span>
                          <p className="small muted">{score.rationale}</p>
                        </div>
                      ) : null}

                      <div className="field" style={{ marginTop: 16 }}>
                        <label htmlFor={`note-${score.id}`}>Reviewer note</label>
                        <textarea
                          id={`note-${score.id}`}
                          name="reviewer_note"
                          defaultValue={score.reviewer_note ?? ""}
                          placeholder="What you changed and why. Kept alongside the agent's rationale, not replacing it."
                          style={{ minHeight: 80 }}
                        />
                      </div>

                      <div className="row" style={{ marginTop: 14 }}>
                        <button type="submit">Save score</button>
                        <span className="hint">
                          Saving recomputes criticality and marks this row as edited.
                        </span>
                      </div>
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
                      <span className="microlabel">Client actions</span>

                      {(actionsByScore.get(score.id) ?? []).map((action) => (
                        <div className="actionrow" key={action.id}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{action.title}</div>
                            <div className="hint">
                              {[action.owner, action.due_date ? `due ${action.due_date}` : null]
                                .filter(Boolean)
                                .join(" · ") || "No owner or due date"}
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
                          <span className={ACTION_STATUS_TONE[action.status] ?? "pill"}>
                            {ACTION_STATUS_LABEL[action.status] ?? action.status}
                          </span>
                          <form method="post" action="/api/actions">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="action_id" value={action.id} />
                            <button className="quiet small" type="submit" aria-label="Delete action">
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
        </section>
      ))}
    </div>
  );
}
