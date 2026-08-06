/**
 * Turning a priority order into dates.
 *
 * The effort scale is already a duration scale — read it back: "days to a few
 * weeks", "one to three months", "a quarter or two", "six months or more". So
 * a bar's length is not a new estimate anybody has to make, it is the one they
 * made in Prioritize. The time scale is a different thing (when the benefit
 * shows) and stays out of the bar.
 *
 * Everything here is deterministic. There is no model call: the ordering comes
 * from priority_score and the lengths from effort_score, both already on the
 * row. A schedule you can regenerate for free is one people will actually
 * re-run after changing an estimate.
 */

/** Working days per effort level, from the midpoint of each band's wording. */
export const EFFORT_DURATION_DAYS: Record<1 | 2 | 3 | 4, number> = {
  1: 14,
  2: 60,
  3: 120,
  4: 240
};

/** Anything unestimated gets the shortest bar rather than none at all. */
export const DEFAULT_DURATION_DAYS = EFFORT_DURATION_DAYS[1];

export function durationDaysFor(effort: number | null | undefined) {
  if (effort === null || effort === undefined) return DEFAULT_DURATION_DAYS;
  const level = Math.min(4, Math.max(1, Math.round(effort))) as 1 | 2 | 3 | 4;
  return EFFORT_DURATION_DAYS[level];
}

/**
 * Dates are handled as YYYY-MM-DD in UTC throughout.
 *
 * Parsing "2026-08-06" with the Date constructor and reading it back in a
 * local timezone west of UTC returns the fifth, which would quietly shift
 * every bar by a day.
 */
export function parseDay(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

export function formatDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  return formatDay(parseDay(value) + days * 86400000);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / 86400000);
}

export function today(): string {
  return formatDay(Date.now());
}

export type Schedulable = {
  id: string;
  owner: string | null;
  /** Higher goes first. Null sorts last. */
  priority: number | null;
  effort: number | null;
};

export type ScheduledDates = { id: string; start_date: string; end_date: string };

/**
 * Lays the work out in priority order, one lane per owner.
 *
 * An owner cannot do two things at once, so each owner's work runs
 * end-to-end. Unassigned work shares a single lane rather than all starting on
 * day one, which would draw a plan nobody could staff. Reordering therefore
 * changes start dates, which is the point: the schedule should show the cost
 * of the priority order, not hide it.
 */
export function proposeSchedule(items: Schedulable[], from: string): ScheduledDates[] {
  const ordered = [...items].sort((a, b) => {
    const left = a.priority ?? -1;
    const right = b.priority ?? -1;
    if (left !== right) return right - left;
    // Stable within a tie so re-running does not reshuffle the plan.
    return a.id.localeCompare(b.id);
  });

  const laneFree = new Map<string, string>();

  return ordered.map((item) => {
    const lane = item.owner?.trim() || "__unassigned__";
    const start = laneFree.get(lane) ?? from;
    const end = addDays(start, durationDaysFor(item.effort));

    laneFree.set(lane, end);

    return { id: item.id, start_date: start, end_date: end };
  });
}

export type Span = { start: string; end: string };

/** The window every bar has to fit inside, padded to whole months. */
export function scheduleWindow(spans: Span[]): Span | null {
  if (spans.length === 0) return null;

  let min = parseDay(spans[0].start);
  let max = parseDay(spans[0].end);

  for (const span of spans) {
    min = Math.min(min, parseDay(span.start));
    max = Math.max(max, parseDay(span.end));
  }

  const first = new Date(min);
  const last = new Date(max);

  return {
    start: formatDay(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1)),
    // Day 0 of the following month is the last day of this one.
    end: formatDay(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 0))
  };
}

export type MonthTick = { label: string; days: number };

/** Month headers, each weighted by how many of its days are in the window. */
export function monthTicks(window: Span): MonthTick[] {
  const ticks: MonthTick[] = [];
  const end = parseDay(window.end);
  let cursor = parseDay(window.start);

  while (cursor <= end) {
    const date = new Date(cursor);
    const monthEnd = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
    const stop = Math.min(monthEnd, end);

    ticks.push({
      label: date.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC"
      }),
      days: Math.round((stop - cursor) / 86400000) + 1
    });

    cursor = monthEnd + 86400000;
  }

  return ticks;
}

/** Where a bar sits in the window, as percentages. */
export function barPosition(window: Span, span: Span) {
  const total = daysBetween(window.start, window.end) || 1;
  const offset = daysBetween(window.start, span.start);
  const length = Math.max(1, daysBetween(span.start, span.end));

  return {
    left: Math.max(0, Math.min(100, (offset / total) * 100)),
    width: Math.max(0.6, Math.min(100, (length / total) * 100))
  };
}
