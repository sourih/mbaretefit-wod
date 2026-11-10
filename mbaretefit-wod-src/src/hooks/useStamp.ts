import { useCallback, useEffect, useState } from 'react';

/** Devuelve [visible, mostrar]: un aviso breve que se apaga solo. */
export function useStamp(duration = 2200): [boolean, () => void] {
  const [stamp, setStamp] = useState(0);
  useEffect(() => {
    if (stamp === 0) return;
    const timer = window.setTimeout(() => setStamp(0), duration);
    return () => window.clearTimeout(timer);
  }, [stamp, duration]);
  const show = useCallback(() => setStamp(Date.now()), []);
  return [stamp !== 0, show];
}
