import { describe, expect, it } from "vitest";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { MATURITY_RUBRIC, rubricFor, rubricLevel } from "@/lib/smeat/rubric";
import {
  criticalityBand,
  criticalityLevel,
  readinessScore,
  readinessTone
} from "@/lib/smeat/presentation";
import { ALL_QUESTIONS, DISCOVERY_QUESTIONS } from "@/lib/smeat/questions";
import { computePriorityScore, quadrantFor } from "@/lib/smeat/effort";
import { computeStages } from "@/lib/smeat/stages";
import {
  computeCriticalityScore,
  impactScale,
  maturityScale,
  MAX_CRITICALITY,
  MIN_CRITICALITY,
  rollUpSegment
} from "@/lib/smeat/scoring";

/**
 * Fixtures are the real values from `reference/SMEAT Tool.xlsm`, Console sheet.
 * The app previously used a different formula with impact inverted, which
 * ranked the workbook's top priority near the bottom. These lock the two
 * models together.
 */

describe("criticality = maturity x impact", () => {
  const cases: Array<[string, number, number, number]> = [
    ["Finance Process and Control", 4, 4, 16],
    ["Customer Experience", 4, 3, 12],
    ["Leadership", 4, 3, 12],
    ["Rewards", 3, 3, 9],
    ["Performance Management", 2, 4, 8],
    ["Digital Enterprise", 2, 3, 6],
    ["Capability", 1, 4, 4],
    ["Internal Operations and Assets", 3, 1, 3],
    ["People and Organization", 1, 2, 2],
    ["Sales and Pricing", 1, 1, 1]
  ];

  it.each(cases)("%s: maturity %i x impact %i = %i", (_label, maturity, impact, expected) => {
    expect(computeCriticalityScore(maturity, impact)).toBe(expected);
  });

  it("spans the documented 1-16 range", () => {
    expect(computeCriticalityScore(1, 1)).toBe(MIN_CRITICALITY);
    expect(computeCriticalityScore(4, 4)).toBe(MAX_CRITICALITY);
  });

  it("ranks an undeveloped critical capability above a mature optional one", () => {
    // maturity 4 = nascent, impact 4 = critical
    expect(computeCriticalityScore(4, 4)).toBeGreaterThan(computeCriticalityScore(1, 1));
  });
});

describe("scale directions", () => {
  it("maturity runs 1 advanced to 4 nascent", () => {
    expect(maturityScale[1]).toBe("Advanced");
    expect(maturityScale[4]).toBe("Nascent");
  });

  // This is the one that was inverted. The workbook's Instructions sheet
  // defines 4 as critical and 1 as not needed.
  it("impact runs 4 critical to 1 not needed", () => {
    expect(impactScale[4]).toBe("Critical");
    expect(impactScale[1]).toBe("Not Needed");
  });
});

describe("segment rollups", () => {
  const segment = (rows: Array<[number, number]>) =>
    rollUpSegment(rows.map(([m, i]) => ({ maturity_score: m, impact_score: i })));

  it("Customer matches Console!H3, I3, J3", () => {
    const s = segment([
      [1, 2],
      [2, 1],
      [1, 1],
      [4, 3]
    ]);
    expect(s.maturity).toBeCloseTo(2.0);
    expect(s.impact).toBeCloseTo(1.75);
    expect(s.criticality).toBe(4);
  });

  it("People matches Console!H9, I9, J9", () => {
    const s = segment([
      [1, 4],
      [2, 4],
      [1, 4],
      [4, 3],
      [3, 3]
    ]);
    expect(s.maturity).toBeCloseTo(2.2);
    expect(s.impact).toBeCloseTo(3.6);
    expect(s.criticality).toBe(7);
  });

  it("Finance matches Console!H23, I23, J23", () => {
    const s = segment([
      [4, 4],
      [2, 3],
      [1, 2],
      [3, 3],
      [3, 3]
    ]);
    expect(s.maturity).toBeCloseTo(2.6);
    expect(s.impact).toBeCloseTo(3.0);
    expect(s.criticality).toBe(8);
  });

  it("averages the criticalities rather than multiplying the averages", () => {
    // Finance: mean criticality 8.4 -> 8. Multiplying the means would give
    // 2.6 * 3.0 = 7.8 -> 8 here, but People would give 2.2 * 3.6 = 7.92 -> 8
    // against the workbook's 7.
    const s = segment([
      [1, 4],
      [2, 4],
      [1, 4],
      [4, 3],
      [3, 3]
    ]);
    expect(s.criticality).toBe(7);
    expect(Math.round((s.maturity as number) * (s.impact as number))).toBe(8);
  });

  it("returns nulls for an empty segment", () => {
    const s = rollUpSegment([]);
    expect(s).toEqual({ maturity: null, impact: null, criticality: null, count: 0 });
  });
});

describe("rubric coverage", () => {
  const allSubdimensions = SMEAT_DIMENSIONS.flatMap((d) =>
    d.subdimensions.map((s) => ({ dimension_key: d.key, subdimension_key: s.key }))
  );

  it("covers all 30 canonical subdimensions", () => {
    expect(allSubdimensions).toHaveLength(30);
    expect(MATURITY_RUBRIC).toHaveLength(30);
  });

  it.each(allSubdimensions)(
    "$dimension_key/$subdimension_key has four levels with content",
    ({ dimension_key, subdimension_key }) => {
      const entry = rubricFor(dimension_key, subdimension_key);
      expect(entry, `missing rubric for ${dimension_key}/${subdimension_key}`).not.toBeNull();
      expect(entry?.levels.map((l) => l.level)).toEqual([1, 2, 3, 4]);
    }
  );

  it("resolves a known definition", () => {
    const level = rubricLevel("customer", "products_markets_channels", 1);
    expect(level?.bullets[0]).toContain("expanding globally");
  });
});

describe("readiness with no data", () => {
  it("is null rather than a perfect score", () => {
    // Criticality bottoms out at 1, so feeding 0 for "nothing scored" produced
    // 106% clamped to 100 — an empty portfolio displayed as flawless.
    expect(readinessScore(null)).toBeNull();
    expect(readinessTone(null)).toBe("empty");
  });

  it("maps the ends of the range", () => {
    expect(readinessScore(MIN_CRITICALITY)).toBe(100);
    expect(readinessScore(MAX_CRITICALITY)).toBe(0);
  });

  it("puts a mid-range average near the middle", () => {
    expect(readinessScore(8.5)).toBe(50);
  });
});

describe("discovery questions", () => {
  it("covers all 30 subdimensions", () => {
    expect(DISCOVERY_QUESTIONS).toHaveLength(30);

    const covered = new Set(
      DISCOVERY_QUESTIONS.map((s) => `${s.dimension_key}:${s.subdimension_key}`)
    );
    for (const dimension of SMEAT_DIMENSIONS) {
      for (const sub of dimension.subdimensions) {
        expect(covered.has(`${dimension.key}:${sub.key}`)).toBe(true);
      }
    }
  });

  it("gives every question all four level cues", () => {
    for (const question of ALL_QUESTIONS) {
      expect(Object.keys(question.listenFor).sort()).toEqual(["1", "2", "3", "4"]);
    }
  });

  it("uses unique ids, since answers key off them", () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("priority", () => {
  it("rewards a critical gap that is cheap to fix", () => {
    // Same criticality, different effort.
    expect(computePriorityScore(16, 1)).toBe(64);
    expect(computePriorityScore(16, 4)).toBe(16);
  });

  it("is null when effort is unknown, not an assumed middle", () => {
    expect(computePriorityScore(16, null)).toBeNull();
    expect(computePriorityScore(16, undefined)).toBeNull();
  });

  it("matches the generated column in migration 0006", () => {
    // criticality * (5 - effort)
    expect(computePriorityScore(12, 2)).toBe(36);
    expect(computePriorityScore(4, 3)).toBe(8);
  });

  it("places rows in the standard quadrants", () => {
    expect(quadrantFor(12, 1)).toBe("quick_win");
    expect(quadrantFor(12, 4)).toBe("major_project");
    expect(quadrantFor(4, 1)).toBe("fill_in");
    expect(quadrantFor(4, 4)).toBe("thankless");
    expect(quadrantFor(12, null)).toBeNull();
  });
});

describe("criticality shown out of four", () => {
  it("uses the same cut points as the band labels", () => {
    for (let score = MIN_CRITICALITY; score <= MAX_CRITICALITY; score += 1) {
      const level = criticalityLevel(score);
      const band = criticalityBand(score);
      expect(["Low", "Moderate", "High", "Critical"][level - 1]).toBe(band);
    }
  });

  it("never goes outside 1–4 across every maturity × impact pair", () => {
    for (let maturity = 1; maturity <= 4; maturity += 1) {
      for (let impact = 1; impact <= 4; impact += 1) {
        const level = criticalityLevel(computeCriticalityScore(maturity, impact));
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(4);
      }
    }
  });

  it("puts the extremes at the extremes", () => {
    expect(criticalityLevel(computeCriticalityScore(1, 1))).toBe(1);
    expect(criticalityLevel(computeCriticalityScore(4, 4))).toBe(4);
  });

  it("rises with the underlying score", () => {
    let previous = 0;
    for (let score = MIN_CRITICALITY; score <= MAX_CRITICALITY; score += 1) {
      const level = criticalityLevel(score);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe("assessment stages", () => {
  const base = {
    assessmentId: "a",
    companyId: "c",
    hasDescription: true,
    documentCount: 1,
    answeredCount: 0,
    needsInputCount: 0,
    scoreCount: 0,
    editedCount: 0,
    estimatedCount: 0,
    actionCount: 0,
    status: "draft"
  };

  const stageFor = (key: string, input: Partial<typeof base>) =>
    computeStages({ ...base, ...input }).find((stage) => stage.key === key)!;

  it("runs profile, discovery, assessment, prioritize, plan", () => {
    expect(computeStages(base).map((stage) => stage.key)).toEqual([
      "profile",
      "discovery",
      "score",
      "prioritize",
      "plan"
    ]);
  });

  it("blocks prioritize and plan until something is scored", () => {
    expect(stageFor("prioritize", {}).state).toBe("blocked");
    expect(stageFor("plan", {}).state).toBe("blocked");
  });

  // Prioritize used to be a panel on Plan, so estimates marked Plan complete
  // even though no action had been decided.
  it("does not let estimates complete the plan stage", () => {
    const input = { scoreCount: 30, estimatedCount: 30 };
    expect(stageFor("prioritize", input).state).toBe("done");
    expect(stageFor("plan", input).state).toBe("todo");
  });

  it("completes plan on actions alone", () => {
    const input = { scoreCount: 30, estimatedCount: 0, actionCount: 3 };
    expect(stageFor("prioritize", input).state).toBe("todo");
    expect(stageFor("plan", input).state).toBe("done");
  });

  it("counts a partial estimate pass as partial", () => {
    expect(stageFor("prioritize", { scoreCount: 30, estimatedCount: 12 }).state).toBe(
      "partial"
    );
  });

  it("sends prioritize and plan to their own routes", () => {
    const input = { scoreCount: 30 };
    expect(stageFor("prioritize", input).href).toBe("/assessments/a/prioritize");
    expect(stageFor("plan", input).href).toBe("/assessments/a/plan");
  });
});
