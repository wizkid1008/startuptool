import { ALL_QUESTIONS } from "@/lib/smeat/questions";

/**
 * The five stages of an assessment, derived from data rather than stored.
 *
 * The original static tool had an explicit four-step path with a stepper, and
 * the rebuild lost it — every capability exists but nothing tells a user where
 * they are or what to do next. Deriving state avoids a status field that drifts
 * from reality.
 */

export type StageKey = "profile" | "discovery" | "score" | "review" | "plan";

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

  const reviewState: StageState =
    input.scoreCount === 0
      ? "blocked"
      : input.status === "finalized"
        ? "done"
        : input.editedCount > 0
          ? "partial"
          : "todo";

  const planState: StageState =
    input.scoreCount === 0
      ? "blocked"
      : input.actionCount > 0
        ? "done"
        : input.estimatedCount > 0
          ? "partial"
          : "todo";

  return [
    {
      key: "profile",
      label: "Profile",
      href: `/companies/${input.companyId}`,
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
      key: "review",
      label: "Review",
      href: assessment,
      state: reviewState,
      detail:
        input.scoreCount === 0
          ? "Assess first"
          : input.status === "finalized"
            ? "Finalised"
            : input.editedCount > 0
              ? `${input.editedCount} edited`
              : "Nothing reviewed yet"
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
            : input.estimatedCount > 0
              ? "Estimated, no actions yet"
              : "No effort estimates"
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
