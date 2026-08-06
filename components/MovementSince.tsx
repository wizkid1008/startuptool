import { findSubdimension } from "@/lib/smeat/model";

type Row = {
  dimension_key: string;
  subdimension_key: string;
  maturity_score: number;
  criticality_score?: number;
};

type Movement = {
  dimension_key: string;
  subdimension_key: string;
  from: number;
  to: number;
  delta: number;
};

/**
 * Change against the previous assessment for the same company.
 *
 * The schema has supported multiple assessments per company since the first
 * migration and nothing ever surfaced the difference between them. "Customer
 * Experience went 4 to 2 in nine months" is the most persuasive output this
 * tool produces, and it costs one extra query.
 *
 * Movement is measured on maturity rather than criticality, because
 * criticality also moves when impact is re-judged — which is a change of
 * opinion about what matters, not evidence that the business improved.
 */
export function MovementSince({
  current,
  previous,
  previousLabel
}: {
  current: Row[];
  previous: Row[];
  previousLabel: string;
}) {
  const before = new Map(
    previous.map((row) => [`${row.dimension_key}:${row.subdimension_key}`, row])
  );

  const movements: Movement[] = [];
  for (const row of current) {
    const key = `${row.dimension_key}:${row.subdimension_key}`;
    const prior = before.get(key);
    if (!prior) continue;

    const delta = prior.maturity_score - row.maturity_score;
    if (delta === 0) continue;

    movements.push({
      dimension_key: row.dimension_key,
      subdimension_key: row.subdimension_key,
      from: prior.maturity_score,
      to: row.maturity_score,
      // Positive means the number fell, and a lower maturity number is more
      // developed — so positive is improvement.
      delta
    });
  }

  if (movements.length === 0) {
    return (
      <p className="muted small">
        No subdimension changed maturity since {previousLabel}.
      </p>
    );
  }

  const improved = movements.filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta);
  const declined = movements.filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta);

  const render = (list: Movement[]) =>
    list.map((movement) => {
      const subdimension = findSubdimension(movement.dimension_key, movement.subdimension_key);
      return (
        <div
          className="between"
          key={`${movement.dimension_key}:${movement.subdimension_key}`}
          style={{ padding: "8px 0" }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>
              {subdimension?.label ?? movement.subdimension_key}
            </div>
            <div className="hint">{movement.dimension_key}</div>
          </div>
          <span className={movement.delta > 0 ? "pill good" : "pill bad"}>
            {movement.from} → {movement.to}
          </span>
        </div>
      );
    });

  return (
    <div className="grid two">
      <div>
        <span className="microlabel">Improved · {improved.length}</span>
        {improved.length > 0 ? render(improved) : <p className="hint">None.</p>}
      </div>
      <div>
        <span className="microlabel">Regressed · {declined.length}</span>
        {declined.length > 0 ? render(declined) : <p className="hint">None.</p>}
      </div>
    </div>
  );
}
