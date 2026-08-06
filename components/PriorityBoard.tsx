import {
  costScale,
  effortScale,
  priorityBand,
  priorityTone,
  quadrantFor,
  QUADRANT_LABEL,
  QUADRANT_NOTE,
  scaleLabel,
  timeScale,
  type Quadrant
} from "@/lib/smeat/effort";
import { findSubdimension } from "@/lib/smeat/model";
import { criticalityTone, pillClass } from "@/lib/smeat/presentation";

type Row = {
  id: string;
  dimension_key: string;
  subdimension_key: string;
  criticality_score?: number;
  effort_score?: number | null;
  time_score?: number | null;
  cost_score?: number | null;
  estimate_confidence?: number | null;
  priority_score?: number | null;
};

const ORDER: Quadrant[] = ["quick_win", "major_project", "fill_in", "thankless"];

/**
 * Sequenced view: what to do first, and why.
 *
 * Criticality alone ranks severity. Priority folds in effort, so a critical
 * gap that is cheap to fix outranks an equally critical one that takes a year.
 * Time and cost are shown rather than folded in — combining all four buries
 * the reasoning behind a single number.
 */
export function PriorityBoard({ scores }: { scores: Row[] }) {
  const estimated = scores.filter(
    (score) => score.priority_score !== null && score.priority_score !== undefined
  );

  if (estimated.length === 0) {
    return (
      <div className="empty">
        <strong>Nothing estimated yet.</strong>
        <span>
          Priority needs an effort estimate. Run the agent, or set effort on a subdimension
          below — the ranking appears as soon as anything has one.
        </span>
      </div>
    );
  }

  const ranked = [...estimated].sort(
    (a, b) => Number(b.priority_score) - Number(a.priority_score)
  );

  const byQuadrant = new Map<Quadrant, Row[]>();
  for (const score of estimated) {
    const quadrant = quadrantFor(Number(score.criticality_score ?? 0), score.effort_score);
    if (!quadrant) continue;
    byQuadrant.set(quadrant, [...(byQuadrant.get(quadrant) ?? []), score]);
  }

  return (
    <div className="stack">
      <div className="grid four">
        {ORDER.map((quadrant) => (
          <div className="stat" key={quadrant}>
            <div className="microlabel">{QUADRANT_LABEL[quadrant]}</div>
            <div className="num">{(byQuadrant.get(quadrant) ?? []).length}</div>
            <div className="stat-note">{QUADRANT_NOTE[quadrant]}</div>
          </div>
        ))}
      </div>

      <div className="tablewrap">
        <div className="tablescroll">
          <table>
            <thead>
              <tr>
                <th />
                <th>Subdimension</th>
                <th>Criticality</th>
                <th>Effort</th>
                <th>Time</th>
                <th>Cost</th>
                <th>Priority</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((score, index) => {
                const subdimension = findSubdimension(
                  score.dimension_key,
                  score.subdimension_key
                );
                const priority = Number(score.priority_score);
                const criticality = Number(score.criticality_score ?? 0);

                return (
                  <tr key={score.id}>
                    <td className="rank muted tnum">{String(index + 1).padStart(2, "0")}</td>
                    <td>
                      <strong>{subdimension?.label ?? score.subdimension_key}</strong>
                      <div className="hint">{score.dimension_key}</div>
                    </td>
                    <td>
                      <span className={pillClass(criticalityTone(criticality))}>
                        {criticality}
                      </span>
                    </td>
                    <td className="muted small nowrap">
                      {scaleLabel(effortScale, score.effort_score)}
                    </td>
                    <td className="muted small nowrap">
                      {scaleLabel(timeScale, score.time_score)}
                    </td>
                    <td className="muted small nowrap">
                      {scaleLabel(costScale, score.cost_score)}
                    </td>
                    <td>
                      <span className={`pill ${priorityTone(priority)}`}>
                        {priority} {priorityBand(priority)}
                      </span>
                    </td>
                    <td className="muted small nowrap">
                      {/* A speculative estimate flags itself rather than
                          quietly topping the list. */}
                      {score.estimate_confidence === 1 ? (
                        <span className="pill ghost">Speculative</span>
                      ) : score.estimate_confidence ? (
                        `${score.estimate_confidence}/4`
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {estimated.length < scores.length ? (
        <p className="hint">
          {scores.length - estimated.length} of {scores.length} subdimensions have no effort
          estimate and are excluded from this ranking.
        </p>
      ) : null}
    </div>
  );
}
