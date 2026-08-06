import { EstimateRow } from "@/components/EstimateRow";
import {
  priorityBand,
  priorityTone,
  quadrantFor,
  QUADRANT_LABEL,
  QUADRANT_NOTE,
  type Quadrant
} from "@/lib/smeat/effort";
import { findSubdimension } from "@/lib/smeat/model";
import { criticalityBand, criticalityLevel, criticalityTone, pillClass } from "@/lib/smeat/presentation";

type Row = {
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
};

const ORDER: Quadrant[] = ["quick_win", "major_project", "fill_in", "thankless"];

/**
 * What to do first, and the estimating that decides it.
 *
 * Criticality alone ranks severity. Priority folds in effort, so a critical gap
 * that is cheap to fix outranks an equally critical one that takes a year. Time
 * and cost are shown rather than folded in — combining all four buries the
 * reasoning behind a single number.
 *
 * The estimates are edited here rather than in the assessment: that view is for
 * judging what is true, this one is for deciding what to do about it.
 */
export function PriorityBoard({ scores }: { scores: Row[] }) {
  if (scores.length === 0) {
    return (
      <div className="empty">
        <strong>Nothing to prioritise yet.</strong>
        <span>Run the assessment first — priority is built from those scores.</span>
      </div>
    );
  }

  const isEstimated = (score: Row) =>
    score.priority_score !== null && score.priority_score !== undefined;

  const estimated = scores.filter(isEstimated);

  // Unestimated rows are listed after the ranked ones rather than hidden. They
  // are where the estimating happens, so omitting them would leave no way to
  // add one.
  const ranked = [
    ...[...estimated].sort((a, b) => Number(b.priority_score) - Number(a.priority_score)),
    ...scores
      .filter((score) => !isEstimated(score))
      .sort((a, b) => Number(b.criticality_score ?? 0) - Number(a.criticality_score ?? 0))
  ];

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

      {estimated.length === 0 ? (
        <p className="hint">
          Nothing has an effort estimate yet, so there is no ranking. Set effort on a row below
          and it moves to the top of the table.
        </p>
      ) : null}

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
                <th>Confidence</th>
                <th />
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((score, index) => {
                const subdimension = findSubdimension(
                  score.dimension_key,
                  score.subdimension_key
                );
                const criticality = Number(score.criticality_score ?? 0);
                const estimatedRow = isEstimated(score);
                const priority = Number(score.priority_score);

                return (
                  <tr key={score.id}>
                    <td className="rank muted tnum">
                      {estimatedRow ? String(index + 1).padStart(2, "0") : "—"}
                    </td>
                    <td>
                      <strong>{subdimension?.label ?? score.subdimension_key}</strong>
                      <div className="hint">{score.dimension_key}</div>
                    </td>
                    <td>
                      <span
                        className={pillClass(criticalityTone(criticality))}
                        title={`${criticality} of 16 · maturity × impact`}
                      >
                        {criticalityLevel(criticality)} {criticalityBand(criticality)}
                      </span>
                    </td>

                    <EstimateRow
                      scoreId={score.id}
                      maturity={score.maturity_score}
                      impact={score.impact_score}
                      effort={score.effort_score ?? null}
                      time={score.time_score ?? null}
                      cost={score.cost_score ?? null}
                      confidence={score.estimate_confidence ?? null}
                    />

                    <td className="nowrap">
                      {estimatedRow ? (
                        <span className={`pill ${priorityTone(priority)}`}>
                          {priorityBand(priority)}
                        </span>
                      ) : (
                        <span className="pill ghost">Set effort</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="hint">
        Priority is criticality × (5 − effort), so a critical gap that is cheap to fix outranks
        an equally critical one that takes a year. Time and cost inform the sequencing without
        changing the rank. A confidence of 1 means the estimate is speculative.
      </p>
    </div>
  );
}
