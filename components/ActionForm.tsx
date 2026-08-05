"use client";

import { useState, type ReactNode } from "react";

/**
 * Plain multipart/urlencoded form with a pending state.
 *
 * The button is disabled from the form's `submit` handler rather than the
 * button's `click` handler: disabling on click can cancel the submission
 * outright in some browsers, whereas by the time `submit` fires the
 * navigation is already underway.
 */
export function ActionForm({
  action,
  label,
  pendingLabel,
  className,
  buttonClassName,
  hint,
  children
}: {
  action: string;
  label: string;
  pendingLabel: string;
  className?: string;
  buttonClassName?: string;
  hint?: string;
  children?: ReactNode;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      className={className}
      method="post"
      action={action}
      onSubmit={() => setPending(true)}
    >
      {children}
      <button className={buttonClassName} type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
      {pending && hint ? <span className="hint">{hint}</span> : null}
    </form>
  );
}
