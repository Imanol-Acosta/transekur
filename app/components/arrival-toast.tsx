"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

export function ArrivalToast({ title, message, closeLabel }: { title: string; message: string; closeLabel: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 8500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <aside className="arrival-toast">
      <div className="arrival-toast-icon"><Icon name="bell" /></div>
      <div role="status"><strong>{title}</strong><p>{message}</p></div>
      <button className="mobile-icon-button" type="button" aria-label={closeLabel} onClick={() => setVisible(false)}><Icon name="close" /></button>
    </aside>
  );
}
