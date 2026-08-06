import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PageHead } from "@/components/PageHead";
import { Stepper } from "@/components/Stepper";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { discoveryQuestionsFor, ALL_QUESTIONS } from "@/lib/smeat/questions";
import { isStaleRun, STALE_RUN_MINUTES } from "@/lib/smeat/run-scoring";
import { computeStages } from "@/lib/smeat/stages";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_PILL: Record<string, string> = {
  answered: "pill good",
  needs_input: "pill warn",
  not_applicable: "pill ghost"
};

const STATUS_LABEL: Record<string, string> = {
  answered: "Answered",
  needs_input: "Needs input",
  not_applicable: "Not applicable"
};

export default async function DiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();

  const [
    { data: assessment },
    { data: answers, error: answersError },
    { data: latestRun }
  ] = await Promise.all([
    supabase.from("assessments").select("id,company_id,status").eq("id", id).single(),
    supabase
      .from("assessment_answers")
      .select("question_id,answer,selected_level,suggested_level,status,source,confidence,evidence")
      .eq("assessment_id", id),
    supabase
      .from("agent_runs")
      .select("id,status,error,created_at,output_payload")
      .eq("assessment_id", id)
      .eq("run_type", "research")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (!assessment) {
    notFound();
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,description")
    .eq("id", assessment.company_id)
    .single();

  const [{ count: documentCount }, { count: scoreCount }, { count: actionCount }] =
    await Promise.all([
      supabase
        .from("company_documents")
        .select("id", { count: "exact", head: true })
        .eq("company_id", assessment.company_id),
      supabase
        .from("assessment_scores")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", id),
      supabase
        .from("assessment_actions")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", id)
    ]);

  const byQuestion = new Map((answers ?? []).map((answer) => [answer.question_id, answer]));

  const answered = (answers ?? []).filter((a) => a.status === "answered").length;
  const needsInput = (answers ?? []).filter((a) => a.status === "needs_input").length;
  const total = ALL_QUESTIONS.length;

  const stages = computeStages({
    assessmentId: assessment.id,
    companyId: assessment.company_id,
    hasDescription: Boolean(company?.description),
    documentCount: documentCount ?? 0,
    answeredCount: answered,
    needsInputCount: needsInput,
    scoreCount: scoreCount ?? 0,
    editedCount: 0,
    estimatedCount: 0,
    actionCount: actionCount ?? 0,
    status: assessment.status
  });

  const stalled = latestRun?.status === "running" && isStaleRun(latestRun.created_at);
  const isRunning = latestRun?.status === "running" && !stalled;
  const hasRun = Boolean(answers && answers.length > 0);

  // Written per dimension as the run advances, so progress is real rather than
  // a spinner. Shape is set by runDiscovery.
  const progress = (latestRun?.output_payload ?? null) as {
    stage?: string;
    completed_dimensions?: number;
    total_dimensions?: number;
  } | null;

  return (
    <>
      <PageHead
        eyebrow={company ? `SMEAT / ${company.name} / Discovery` : "SMEAT / Discovery"}
        title="Discovery"
        lede="What the agent could establish from the evidence, and what it still needs from you. Scoring reads these answers."
        actions={
          <>
            {isRunning ? (
              <span className="pill info">Discovery in progress</span>
            ) : (
              <ActionForm
                action="/api/agent/discover"
                label={hasRun ? "Re-run discovery" : "Run discovery"}
                pendingLabel="Starting…"
              >
                <input type="hidden" name="assessment_id" value={assessment.id} />
              </ActionForm>
            )}
            <Link className="btn secondary" href={`/assessments/${assessment.id}`}>
              Back to assessment
            </Link>
          </>
        }
      />

      <Stepper stages={stages} current="discovery" />

      {/* Without this the page renders zeros and the run fails in the
          background, which looks exactly like nothing happening. */}
      {answersError ? (
        <div className="notice bad" style={{ marginBottom: 20 }}>
          <strong>Discovery is not set up yet.</strong>
          <span className="small">{answersError.message}</span>
          <span className="small">
            This almost always means migration{" "}
            <code>0005_assessment_answers.sql</code> has not been run. Apply it in the Supabase
            SQL Editor, then reload. Running discovery before that will fail silently.
          </span>
        </div>
      ) : null}

      {isRunning ? (
        <div className="notice" style={{ marginBottom: 20 }}>
          <strong>
            Discovery in progress
            {progress?.stage ? ` — ${progress.stage}` : ""}.
          </strong>
          <span className="small">
            {progress?.total_dimensions
              ? `Segment ${(progress.completed_dimensions ?? 0) + 1} of ${progress.total_dimensions}. Answers are saved as each one finishes.`
              : `Working through ${total} questions against the company profile and any uploaded documents.`}{" "}
            <AutoRefresh startedAt={latestRun?.created_at} />
          </span>
        </div>
      ) : null}

      {stalled ? (
        <div className="notice warn" style={{ marginBottom: 20 }}>
          <strong>That run appears to have stopped.</strong>
          <span className="small">
            Running for over {STALE_RUN_MINUTES} minutes, which usually means the server
            restarted. Start a new run.
          </span>
        </div>
      ) : null}

      {latestRun?.status === "failed" ? (
        <div className="notice bad" style={{ marginBottom: 20 }}>
          <strong>The last discovery run failed.</strong>
          {latestRun.error ? <span className="small">{latestRun.error}</span> : null}
        </div>
      ) : null}

      <div className="grid four">
        <div className="stat">
          <div className="microlabel">Answered</div>
          <div className="num">{answered}</div>
          <div className="stat-note">of {total} questions</div>
        </div>
        <div className="stat">
          <div className="microlabel">Needs your input</div>
          <div className="num">{needsInput}</div>
          <div className="stat-note">The agent could not settle these</div>
        </div>
        <div className="stat">
          <div className="microlabel">Coverage</div>
          <div className="num">
            {total > 0 ? Math.round((answered / total) * 100) : 0}
            <span className="num-unit"> %</span>
          </div>
          <div className="meter">
            <span style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="stat">
          <div className="microlabel">Unstarted</div>
          <div className="num">{total - (answers?.length ?? 0)}</div>
          <div className="stat-note">Not yet reached by a run</div>
        </div>
      </div>

      {!hasRun && !isRunning ? (
        <div className="notice" style={{ marginTop: 20 }}>
          <strong>Nothing gathered yet.</strong>
          <span className="small">
            Upload documents to the company first — the agent reads those plus the company
            profile. With little uploaded, expect most questions to come back needing your input,
            which is the honest result rather than a guess.
          </span>
        </div>
      ) : null}

      {SMEAT_DIMENSIONS.map((dimension) => (
        <section className="section" key={dimension.key}>
          <div className="card-head">
            <h2>{dimension.label}</h2>
            <span className="microlabel">{dimension.description}</span>
          </div>

          <div className="tablewrap">
            {dimension.subdimensions.map((subdimension) => {
              const questions = discoveryQuestionsFor(dimension.key, subdimension.key);
              const outstanding = questions.filter(
                (question) => byQuestion.get(question.id)?.status !== "answered"
              ).length;

              return (
                <details key={subdimension.key}>
                  <summary>
                    <span>
                      <strong>{subdimension.label}</strong>
                    </span>
                    <span className="hidesm muted small">{questions.length} questions</span>
                    <span className="hidesm" />
                    <span>
                      {outstanding === 0 ? (
                        <span className="pill good">Complete</span>
                      ) : (
                        <span className="pill warn">{outstanding} outstanding</span>
                      )}
                    </span>
                    <span className="chev" aria-hidden="true">
                      ▶
                    </span>
                  </summary>

                  <div className="expand">
                    {questions.map((question) => {
                      const answer = byQuestion.get(question.id);
                      const status = answer?.status ?? "needs_input";

                      return (
                        <div className="qblock" key={question.id}>
                          <div className="between">
                            <strong className="small">{question.prompt}</strong>
                            <span className={STATUS_PILL[status] ?? "pill"}>
                              {STATUS_LABEL[status] ?? status}
                            </span>
                          </div>

                          {answer?.evidence ? (
                            <p className="hint">
                              <b>{answer.source === "ai" ? "Agent" : "You"}:</b> {answer.evidence}
                              {answer.confidence !== null && answer.confidence !== undefined
                                ? ` · confidence ${Math.round(answer.confidence * 100)}%`
                                : ""}
                            </p>
                          ) : null}

                          <form method="post" action="/api/answers">
                            <input type="hidden" name="assessment_id" value={assessment.id} />
                            <input type="hidden" name="dimension_key" value={dimension.key} />
                            <input
                              type="hidden"
                              name="subdimension_key"
                              value={subdimension.key}
                            />
                            <input type="hidden" name="question_id" value={question.id} />
                            <input type="hidden" name="status" value="needs_input" />

                            {/* The cues double as the answer. Most answers are
                                really "they're a 3" — making that selectable
                                keeps the structure that prose would lose. */}
                            <div className="cuepick">
                              {[1, 2, 3, 4].map((level) => (
                                <label key={level}>
                                  <input
                                    type="radio"
                                    name="selected_level"
                                    value={level}
                                    defaultChecked={answer?.selected_level === level}
                                  />
                                  <span className="lvlnum">{level}</span>
                                  <span>
                                    {question.listenFor[level as 1 | 2 | 3 | 4]}
                                    {answer?.suggested_level === level ? (
                                      <span className="pill ghost" style={{ marginLeft: 6 }}>
                                        Agent&rsquo;s read
                                      </span>
                                    ) : null}
                                  </span>
                                </label>
                              ))}
                            </div>

                            <textarea
                              name="answer"
                              defaultValue={answer?.answer ?? ""}
                              placeholder="Add detail, or leave blank — selecting a level above is enough"
                              style={{ minHeight: 56 }}
                            />
                            <button className="secondary small" type="submit">
                              Save answer
                            </button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
