import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { criticalityBand } from "@/lib/smeat/presentation";
import { rollUpSegment } from "@/lib/smeat/scoring";

type ScoreRow = {
  dimension_key: string;
  maturity_score: number;
  impact_score: number;
  criticality_score?: number;
};

/** Cell fill follows the criticality band, so the worst segments read first. */
function heatClass(criticality: number | null) {
  if (criticality === null) return "heat-none";
  if (criticality >= 12) return "heat-4";
  if (criticality >= 8) return "heat-3";
  if (criticality >= 4) return "heat-2";
  return "heat-1";
}

/**
 * The seven SMEAT segments as a heat map. Segment figures use the workbook's
 * rollup: mean maturity and impact, rounded mean criticality.
 */
export function SegmentHeatMap({ scores }: { scores: ScoreRow[] }) {
  const segments = SMEAT_DIMENSIONS.map((dimension) => {
    const rows = scores.filter((score) => score.dimension_key === dimension.key);
    return { dimension, rollup: rollUpSegment(rows) };
  });

  return (
    <div className="heatmap">
      {segments.map(({ dimension, rollup }) => (
        <div className={`heat ${heatClass(rollup.criticality)}`} key={dimension.key}>
          <div className="heat-label">{dimension.label}</div>
          <div className="heat-value">
            {rollup.criticality === null ? "—" : rollup.criticality}
          </div>
          <div className="heat-meta">
            {rollup.criticality === null
              ? "Not scored"
              : criticalityBand(rollup.criticality)}
          </div>
          <div className="heat-sub">
            {rollup.maturity === null
              ? `0 of ${dimension.subdimensions.length}`
              : `M ${rollup.maturity.toFixed(1)} · I ${rollup.impact?.toFixed(1)}`}
          </div>
        </div>
      ))}
    </div>
  );
}
