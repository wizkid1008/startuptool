import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/PageHead";
import { PriorityBoard } from "@/components/PriorityBoard";
import { Stepper } from "@/components/Stepper";
import { findSubdimension, SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { formatDate } from "@/lib/smeat/presentation";
import { computeStages } from "@/lib/smeat/stages";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  dropped: "Dropped"
};

const STATUS_TONE: Record<string, string> = {
  open: "pill warn",
  in_progress: "pill info",
  done: "pill good",
  dropped: "pill ghost"
};

const ORDER = ["open", "in_progress", "done", "dropped"];

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();

  const [{ data: assessment }, { data: scores }, { data: actions }, { data: answers }] =
    await Promise.all([
      supabase.from("assessments").select("*").eq("id", id).single(),
      supabase.from("assessment_scores").select("*").eq("assessment_id", id),
      supabase
        .from("assessment_actions")
        .select("*")
        .eq("assessment_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("assessment_answers")
        .select("status")
        .eq("assessment_id", id)
    ]);

  if (!assessment) {
    notFound();
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,description")
    .eq("id", assessment.company_id)
    .single();

  const { count: documentCount } = await supabase
    .from("company_documents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", assessment.company_id);

  const rows = scores ?? [];
  const list = actions ?? [];

  const stages = computeStages({
    assessmentId: assessment.id,
    companyId: assessment.company_id,
    hasDescription: Boolean(company?.description),
    documentCount: documentCount ?? 0,
    answeredCount: (answers ?? []).filter((a) => a.status === "answered").length,
    needsInputCount: (answers ?? []).filter((a) => a.status === "needs_input").length,
    scoreCount: rows.length,
    editedCount: rows.filter((row) => row.source === "manual").length,
    estimatedCount: rows.filter((row) => row.effort_score !== null).length,
    actionCount: list.length,
    status: assessment.status
  });

  const byStatus = ORDER.map((status) => ({
    status,
    items: list.filter((action) => action.status === status)
  })).filter((group) => group.items.length > 0);

  const open = list.filter((a) => a.status === "open" || a.status === "in_progress").length;

  return (
    <>
      <PageHead
        eyebrow={company ? `SMEAT / ${company.name} / Plan` : "SMEAT / Plan"}
        title="Plan"
        lede="What to do first, and who is doing it. Ranked by criticality against the effort to fix."
        actions={
          <>
            <Link className="btn secondary" href={`/assessments/${assessment.id}`}>
              Back to assessment
            </Link>
            <form method="post" action="/api/excel/export">
              <input type="hidden" name="assessment_id" value={assessment.id} />
              <button className="secondary" type="submit">
                Export Excel
              </button>
            </form>
          </>
        }
      />

      <Stepper stages={stages} current="plan" />

      <section className="section">
        <div className="card-head">
          <h2>Priority</h2>
          <span className="microlabel">Criticality × (5 − effort) · 1–64</span>
        </div>
        <PriorityBoard scores={rows} />
      </section>

      <section className="section">
        <div className="card-head">
          <h2>Actions</h2>
          <span className="microlabel">
            {list.length === 0
              ? "None yet"
              : `${open} open of ${list.length}`}
          </span>
        </div>

        {/* Adding lives here rather than inside the assessment panels — this
            is the page about what to do, and an action buried behind a segment
            selection and an accordion was hard to find again. */}
        <form method="post" action="/api/actions" className="actionform card">
          <input type="hidden" name="intent" value="create" />
          <input type="hidden" name="assessment_id" value={assessment.id} />

          <select name="assessment_score_id" required defaultValue="" aria-label="Subdimension">
            <option value="" disabled>
              Against which subdimension…
            </option>
            {SMEAT_DIMENSIONS.map((dimension) => {
              const options = rows.filter((row) => row.dimension_key === dimension.key);
              if (options.length === 0) return null;

              return (
                <optgroup key={dimension.key} label={dimension.label}>
                  {options.map((row) => (
                    <option key={row.id} value={row.id}>
                      {findSubdimension(row.dimension_key, row.subdimension_key)?.label ??
                        row.subdimension_key}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          <input name="title" placeholder="What needs doing" required />
          <input name="owner" placeholder="Owner" />
          <input name="due_date" type="date" aria-label="Due date" />
          <button type="submit">Add action</button>
        </form>

        {rows.length === 0 ? (
          <p className="hint" style={{ marginTop: 10 }}>
            Actions attach to a subdimension, so the assessment has to be scored first.
          </p>
        ) : null}

        {list.length === 0 ? (
          <div className="empty">
            <strong>No actions yet.</strong>
            <span>Add the first one above. They group by status as they accumulate.</span>
          </div>
        ) : (
          <div className="stack">
            {byStatus.map((group) => (
              <div key={group.status}>
                <span className="microlabel">
                  {STATUS_LABEL[group.status]} · {group.items.length}
                </span>
                <div className="tablewrap" style={{ marginTop: 8 }}>
                  <div className="tablescroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Subdimension</th>
                          <th>Owner</th>
                          <th>Due</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((action) => {
                          const subdimension =
                            action.dimension_key && action.subdimension_key
                              ? findSubdimension(action.dimension_key, action.subdimension_key)
                              : null;

                          return (
                            <tr key={action.id}>
                              <td>
                                <strong>{action.title}</strong>
                                {action.detail ? (
                                  <div className="hint">{action.detail}</div>
                                ) : null}
                              </td>
                              <td className="muted small">
                                {subdimension?.label ?? action.subdimension_key ?? "—"}
                              </td>
                              <td className="muted small">{action.owner ?? "—"}</td>
                              <td className="muted small nowrap">
                                {action.due_date ? formatDate(action.due_date) : "—"}
                              </td>
                              <td>
                                <span className={STATUS_TONE[action.status] ?? "pill"}>
                                  {STATUS_LABEL[action.status] ?? action.status}
                                </span>
                              </td>
                              <td className="nowrap">
                                <form method="post" action="/api/actions" className="row">
                                  <input type="hidden" name="intent" value="update" />
                                  <input type="hidden" name="action_id" value={action.id} />
                                  <select name="status" defaultValue={action.status}>
                                    {ORDER.map((value) => (
                                      <option key={value} value={value}>
                                        {STATUS_LABEL[value]}
                                      </option>
                                    ))}
                                  </select>
                                  <button className="secondary small" type="submit">
                                    Set
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
