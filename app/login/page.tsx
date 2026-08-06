import { PageHead } from "@/components/PageHead";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  invalid: "That email and password combination was not recognised.",
  exists: "An account already exists for that email. Sign in instead.",
  weak: "Passwords must be at least 8 characters.",
  confirm: "Check your email to confirm the account, then sign in.",
  signup_disabled: "Sign-ups are disabled for this project.",
  unknown: "Something went wrong. Try again."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <>
      <PageHead
        eyebrow="SMEAT / Sign in"
        title="Sign in"
        lede="Assessments are shared across your organization."
      />

      {error ? (
        <div className="notice bad" style={{ marginBottom: 20 }}>
          <strong>{MESSAGES[error] ?? MESSAGES.unknown}</strong>
        </div>
      ) : null}

      {message ? (
        <div className="notice" style={{ marginBottom: 20 }}>
          <strong>{MESSAGES[message] ?? message}</strong>
        </div>
      ) : null}

      <div className="grid two">
        <form className="card form" method="post" action="/auth/signin">
          <div className="card-head">
            <h2>Sign in</h2>
          </div>
          <input type="hidden" name="next" value={next ?? "/"} />
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit">Sign in</button>
        </form>

        <form className="card form" method="post" action="/auth/signup">
          <div className="card-head">
            <h2>Create an account</h2>
          </div>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="signup_email">Email</label>
            <input
              id="signup_email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="signup_password">Password</label>
            <input
              id="signup_password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="hint">At least 8 characters.</span>
          </div>
          <button className="secondary" type="submit">
            Create account
          </button>
        </form>
      </div>
    </>
  );
}
