import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { barPosition, monthTicks, scheduleWindow, type Span } from "@/lib/smeat/schedule";

export type GanttRow = {
  id: string;
  title: string;
  owner: string | null;
  status: string;
  dimensionKey: string | null;
  subdimensionLabel: string;
  start: string;
  end: string;
};

const STATUS_CLASS: Record<string, string> = {
  open: "bar-open",
  in_progress: "bar-active",
  done: "bar-done",
  dropped: "bar-dropped"
};

/**
 * The plan on a timeline.
 *
 * Bars are positioned as percentages of the whole window rather than in fixed
 * pixels per day, so a two-year plan and a two-month one both fill the width
 * and neither needs a horizontal scrollbar to be readable. Grouped by
 * dimension, matching how the rest of the tool is organised — the question
 * being answered is usually "what is happening to Sales", not "what is
 * happening in March".
 */
export function Gantt({ rows }: { rows: GanttRow[] }) {
  const window = scheduleWindow(rows.map((row): Span => ({ start: row.start, end: row.end })));

  if (!window || rows.length === 0) {
    return (
      <div className="empty">
        <strong>Nothing is scheduled.</strong>
        <span>Propose a schedule and every open action gets a start and an end.</span>
      </div>
    );
  }

  const ticks = monthTicks(window);
  const totalDays = ticks.reduce((sum, tick) => sum + tick.days, 0) || 1;

  // Typed explicitly: dimension.key is a literal union, so an "unassigned"
  // group keyed with anything else cannot be concatenated onto the inferred
  // array.
  type Group = { key: string; label: string; items: GanttRow[] };

  const groups: Group[] = SMEAT_DIMENSIONS.map((dimension) => ({
    key: dimension.key as string,
    label: dimension.label,
    items: rows.filter((row) => row.dimensionKey === dimension.key)
  })).filter((group) => group.items.length > 0);

  // Re-scoring nulls the keys on an action, so an orphan is normal rather
  // than a bug, and dropping it from the chart would hide real work.
  const orphans = rows.filter((row) => !row.dimensionKey);
  if (orphans.length > 0) {
    groups.push({ key: "__none__", label: "Unassigned", items: orphans });
  }

  return (
    <div className="gantt">
      <div className="gantt-head">
        <div className="gantt-label" />
        <div className="gantt-track">
          {ticks.map((tick, index) => (
            <span
              className="gantt-month"
              key={`${tick.label}-${index}`}
              style={{ width: `${(tick.days / totalDays) * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {groups.map((group) => (
        <div className="gantt-group" key={group.key}>
          <div className="microlabel gantt-grouplabel">{group.label}</div>

          {group.items.map((row) => {
            const { left, width } = barPosition(window, { start: row.start, end: row.end });

            return (
              <div className="gantt-row" key={row.id}>
                <div className="gantt-label">
                  <span className="gantt-title">{row.title}</span>
                  <span className="hint">{row.owner ?? "Unassigned"}</span>
                </div>
                <div className="gantt-track">
                  {ticks.map((tick, index) => (
                    <span
                      className="gantt-gridline"
                      key={index}
                      style={{ width: `${(tick.days / totalDays) * 100}%` }}
                    />
                  ))}
                  <span
                    className={`gantt-bar ${STATUS_CLASS[row.status] ?? "bar-open"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${row.title} · ${row.start} to ${row.end}`}
                  >
                    <span className="gantt-barlabel">{row.subdimensionLabel}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
