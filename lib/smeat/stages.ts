import { ALL_QUESTIONS } from "@/lib/smeat/questions";

/**
 * The five stages of an assessment, derived from data rather than stored.
 *
 * The original static tool had an explicit step path with a stepper, and the
 * rebuild lost it — every capability exists but nothing tells a user where
 * they are or what to do next. Deriving state avoids a status field that drifts
 * from reality.
 *
 * Each stage answers one question: who is this company, what do we know, where
 * are they, what matters most and what will it cost, and what are we doing
 * about it. Prioritize was a section of Plan until it became clear that the
 * step nobody sees is the step nobody does.
 */

export type StageKey = "profile" | "discovery" | "score" | "prioritize" | "plan";

export type StageState = "blocked" | "todo" | "partial" | "done";

export type Stage = {
  key: StageKey;
  label: string;
  href: string;
  state: StageState;
  /** What is true now, or what is missing. Shown under the label. */
  detail: string;
};

export type StageInput = {
  assessmentId: string;
  companyId: string;
  hasDescription: boolean;
  documentCount: number;
  answeredCount: number;
  needsInputCount: number;
  scoreCount: number;
  editedCount: number;
  estimatedCount: number;
  actionCount: number;
  status: string;
};

const TOTAL_SUBDIMENSIONS = 30;

export function computeStages(input: StageInput): Stage[] {
  const assessment = `/assessments/${input.assessmentId}`;
  const totalQuestions = ALL_QUESTIONS.length;

  // Profile: enough context for discovery to have anything to read.
  const profileDone = input.hasDescription || input.documentCount > 0;

  const discoveryTouched = input.answeredCount + input.needsInputCount > 0;
  const discoveryState: StageState = !discoveryTouched
    ? "todo"
    : input.answeredCount >= totalQuestions
      ? "done"
      : "partial";

  const scoreState: StageState =
    input.scoreCount === 0
      ? "todo"
      : input.scoreCount >= TOTAL_SUBDIMENSIONS
        ? "done"
        : "partial";

  // Prioritize is where effort, time and cost get set. Nothing can be ranked
  // until they are, which is why it is a step of its own rather than a panel
  // on Plan that people scrolled past.
  const prioritizeState: StageState =
    input.scoreCount === 0
      ? "blocked"
      : input.estimatedCount === 0
        ? "todo"
        : input.estimatedCount >= input.scoreCount
          ? "done"
          : "partial";

  // Plan is about actions only now. It used to be marked complete by work done
  // in Prioritize, which made the stepper claim a plan existed when nothing
  // had been decided.
  const planState: StageState =
    input.scoreCount === 0
      ? "blocked"
      : input.actionCount > 0
        ? "done"
        : "todo";

  return [
    {
      key: "profile",
      label: "Profile",
      // Carries the assessment so the company page can keep showing the
      // stepper — otherwise stepping back drops you out of the flow entirely.
      href: `/companies/${input.companyId}?assessment=${input.assessmentId}`,
      state: profileDone ? "done" : "todo",
      detail: profileDone
        ? `${input.documentCount} document${input.documentCount === 1 ? "" : "s"}`
        : "Add a description or upload documents"
    },
    {
      key: "discovery",
      label: "Discovery",
      href: `${assessment}/discovery`,
      state: discoveryState,
      detail: discoveryTouched
        ? `${input.answeredCount} of ${totalQuestions} answered`
        : "Not started"
    },
    {
      key: "score",
      label: "Assessment",
      href: assessment,
      state: scoreState,
      detail:
        input.scoreCount === 0
          ? "Not scored"
          : `${input.scoreCount} of ${TOTAL_SUBDIMENSIONS} subdimensions`
    },
    {
      key: "prioritize",
      label: "Prioritize",
      href: `${assessment}/prioritize`,
      state: prioritizeState,
      detail:
        input.scoreCount === 0
          ? "Assess first"
          : input.estimatedCount === 0
            ? "No effort estimates"
            : `${input.estimatedCount} of ${input.scoreCount} estimated`
    },
    {
      key: "plan",
      label: "Plan",
      href: `${assessment}/plan`,
      state: planState,
      detail:
        input.scoreCount === 0
          ? "Assess first"
          : input.actionCount > 0
            ? `${input.actionCount} action${input.actionCount === 1 ? "" : "s"}`
            : "No actions yet"
    }
  ];
}

/** The stage a user should most likely act on next. */
export function nextStage(stages: Stage[]) {
  return (
    stages.find((stage) => stage.state === "todo") ??
    stages.find((stage) => stage.state === "partial") ??
    null
  );
}
