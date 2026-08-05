import { Fragment } from "react";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import {
  impactLabel,
  impactTone,
  maturityLabel,
  maturityTone,
  opportunityTone,
  pillClass
} from "@/lib/smeat/presentation";
import { computeOpportunityScore } from "@/lib/smeat/scoring";

type ScoreRow = {
  dimension_key: string;
  subdimension_key: string;
  maturity_score: number;
  impact_score: number;
  opportunity_score?: number;
  confidence?: number | null;
  rationale?: string | null;
  source?: string;
};

export function ScoreMatrix({ scores }: { scores: ScoreRow[] }) {
  const byKey = new Map(
    scores.map((score) => [`${score.dimension_key}:${score.subdimension_key}`, score])
  );

  return (
    <div className="tablewrap">
      <div className="tablescroll">
        <table>
          <thead>
            <tr>
              <th>Subdimension</th>
              <th>Maturity</th>
              <th>Impact</th>
              <th>Opportunity</th>
              <th>Confidence</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {SMEAT_DIMENSIONS.map((dimension) => (
              <Fragment key={dimension.key}>
                <tr className="grouprow">
                  <td colSpan={6}>
                    <span className="microlabel">{dimension.label}</span>
                  </td>
                </tr>

                {dimension.subdimensions.map((subdimension) => {
                  const score = byKey.get(`${dimension.key}:${subdimension.key}`);

                  if (!score) {
                    return (
                      <tr key={subdimension.key}>
                        <td>{subdimension.label}</td>
                        <td colSpan={5} className="muted small">
                          Not scored
                        </td>
                      </tr>
                    );
                  }

                  const opportunity = Number(
                    score.opportunity_score ??
                      computeOpportunityScore(score.maturity_score, score.impact_score)
                  );

                  return (
                    <tr key={subdimension.key}>
                      <td>{subdimension.label}</td>
                      <td>
                        <span className={pillClass(maturityTone(score.maturity_score))}>
                          {score.maturity_score} {maturityLabel(score.maturity_score)}
                        </span>
                      </td>
                      <td>
                        <span className={pillClass(impactTone(score.impact_score))}>
                          {score.impact_score} {impactLabel(score.impact_score)}
                        </span>
                      </td>
                      <td>
                        <span className={pillClass(opportunityTone(opportunity))}>
                          {opportunity.toFixed(0)}
                        </span>
                      </td>
                      <td className="tnum muted">
                        {score.confidence === null || score.confidence === undefined
                          ? "—"
                          : `${Math.round(score.confidence * 100)}%`}
                      </td>
                      <td className="wrap">{score.rationale ?? "—"}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
