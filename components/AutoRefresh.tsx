"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Re-fetches the current server component tree on an interval. Used while a
 * scoring run is in progress so the page reflects its real status instead of
 * a stale snapshot.
 */
export function AutoRefresh({
  intervalMs = 5000,
  startedAt
}: {
  intervalMs?: number;
  startedAt?: string | null;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  useEffect(() => {
    if (!startedAt) return;
    const started = new Date(startedAt).getTime();
    if (Number.isNaN(started)) return;

    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - started) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (elapsed === null) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="tnum">
      {minutes > 0 ? `${minutes}m ` : ""}
      {seconds}s elapsed
    </span>
  );
}
