import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { computeOpportunityScore, impactScale, maturityScale } from "@/lib/smeat/scoring";

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
    <div className="panel" style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Subdimension</th>
            <th>Maturity</th>
            <th>Impact</th>
            <th>Opportunity</th>
            <th>Confidence</th>
            <th>Rationale</th>
          </tr>
        </thead>
        <tbody>
          {SMEAT_DIMENSIONS.flatMap((dimension) =>
            dimension.subdimensions.map((subdimension) => {
              const score = byKey.get(`${dimension.key}:${subdimension.key}`);
              const opportunity =
                score?.opportunity_score ??
                (score
                  ? computeOpportunityScore(score.maturity_score, score.impact_score)
                  : null);

              return (
                <tr key={`${dimension.key}:${subdimension.key}`}>
                  <td>{dimension.label}</td>
                  <td>{subdimension.label}</td>
                  <td>
                    {score ? (
                      <span className="score">
                        {score.maturity_score}{" "}
                        {maturityScale[score.maturity_score as keyof typeof maturityScale]}
                      </span>
                    ) : (
                      <span className="muted">Not scored</span>
                    )}
                  </td>
                  <td>
                    {score ? (
                      <span className="score">
                        {score.impact_score} {impactScale[score.impact_score as keyof typeof impactScale]}
                      </span>
                    ) : (
                      <span className="muted">Not scored</span>
                    )}
                  </td>
                  <td>{opportunity === null ? "-" : Number(opportunity).toFixed(1)}</td>
                  <td>
                    {score?.confidence === null || score?.confidence === undefined
                      ? "-"
                      : `${Math.round(score.confidence * 100)}%`}
                  </td>
                  <td className="muted">{score?.rationale ?? ""}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
