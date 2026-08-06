/**
 * An agent proposal is not yet part of the plan.
 *
 * Everywhere outside the Plan page's "Proposed" section — the stage counts,
 * the assessment panels, the Excel export — an action should only appear once
 * a person has written it or accepted it. Otherwise a list nobody has read
 * looks exactly like a list of decisions.
 *
 * Pass to a PostgREST `.or(...)`: manual actions, plus accepted proposals.
 */
export const PLANNED_ONLY = "source.neq.ai,accepted_at.not.is.null";

/** Below this the rubric gap is not worth a plan of its own. */
export const ACTION_CRITICALITY_FLOOR = 8;
