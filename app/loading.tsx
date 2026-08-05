export default function Loading() {
  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Loading</div>
          <h1 className="muted">Fetching workspace…</h1>
        </div>
      </div>

      <div className="grid four">
        {[0, 1, 2, 3].map((index) => (
          <div className="stat" key={index}>
            <div className="microlabel">&nbsp;</div>
            <div className="num muted">—</div>
            <div className="meter">
              <span style={{ width: "0%" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
