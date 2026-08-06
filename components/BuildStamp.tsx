/**
 * Which build you are actually looking at.
 *
 * A stale deploy is invisible: the page renders fine, it is just an older
 * version of the truth, and the only symptom is a change you know you made
 * failing to appear. Render sets these on every deploy, so the answer costs
 * nothing to show.
 *
 * `RENDER_GIT_COMMIT` is the full sha; the first seven characters are what
 * `git log --oneline` prints, so it can be matched by eye.
 */
export function BuildStamp() {
  const commit = process.env.RENDER_GIT_COMMIT ?? null;
  const branch = process.env.RENDER_GIT_BRANCH ?? null;

  if (!commit) {
    return (
      <footer className="buildstamp">
        <span>Local or unknown build</span>
      </footer>
    );
  }

  return (
    <footer className="buildstamp">
      <span className="tnum">{commit.slice(0, 7)}</span>
      {branch ? <span>{branch}</span> : null}
    </footer>
  );
}
