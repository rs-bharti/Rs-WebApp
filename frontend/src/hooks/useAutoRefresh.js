import { useEffect, useRef } from 'react';

export const emitDataChange = () => {
  window.dispatchEvent(new CustomEvent('rs:data-changed'));
};

export function useAutoRefresh(fn, intervalMs = 15000) {
  // Always keep the ref pointing to the latest fn — no useEffect lag
  const ref = useRef(fn);
  ref.current = fn;

  useEffect(() => {
    const call = () => { try { ref.current(); } catch (e) { console.error(e); } };
    const id   = setInterval(call, intervalMs);

    const onVis = () => { if (document.visibilityState === 'visible') call(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('rs:data-changed', call);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('rs:data-changed', call);
    };
  }, [intervalMs]); // only depends on the interval, never re-registers unnecessarily
}
