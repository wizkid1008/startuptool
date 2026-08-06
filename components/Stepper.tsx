import Link from "next/link";
import type { Stage, StageKey } from "@/lib/smeat/stages";

const MARK: Record<Stage["state"], string> = {
  done: "✓",
  partial: "◐",
  todo: "",
  blocked: ""
};

/**
 * Where you are in the assessment, and what is left.
 *
 * Mirrors the four-step path the original static tool made explicit on its
 * homepage. State is derived from data, so it cannot claim a stage is complete
 * when the underlying rows say otherwise.
 */
export function Stepper({ stages, current }: { stages: Stage[]; current: StageKey }) {
  return (
    <nav className="stepper" aria-label="Assessment progress">
      {stages.map((stage, index) => {
        const isCurrent = stage.key === current;
        const blocked = stage.state === "blocked";
        const className = [
          "step",
          `step-${stage.state}`,
          isCurrent ? "step-current" : ""
        ]
          .filter(Boolean)
          .join(" ");

        const body = (
          <>
            <span className="step-num">{MARK[stage.state] || index + 1}</span>
            <span className="step-body">
              <span className="step-label">{stage.label}</span>
              <span className="step-detail">{stage.detail}</span>
            </span>
          </>
        );

        return blocked ? (
          <span className={className} key={stage.key} aria-disabled="true">
            {body}
          </span>
        ) : (
          <Link
            className={className}
            key={stage.key}
            href={stage.href}
            aria-current={isCurrent ? "step" : undefined}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
