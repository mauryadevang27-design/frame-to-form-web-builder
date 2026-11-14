import { useEffect, useState } from "react";

/** Re-renders on an interval while `active`, returning the current epoch ms. */
export function useNow(active: boolean, intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
