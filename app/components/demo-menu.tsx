"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ClientLanguage } from "../../lib/client-language";
import { getDispatchDemoChoices, openDispatchDemo, returnToDispatchDemo } from "../actions";
import { Icon } from "./icons";
import { MobileSheet } from "./mobile-sheet";

export type DemoMenuContext =
  | { view: "dispatch" }
  | { view: "driver"; clientHref: string }
  | { view: "client"; operator: "dispatch" | "driver"; driverHref?: string; language: ClientLanguage };

type DemoPickup = Awaited<ReturnType<typeof getDispatchDemoChoices>>[number];

function DispatchChoices({ pickups }: { pickups: DemoPickup[] }) {
  const [state, action, pending] = useActionState(openDispatchDemo, {});

  if (pickups.length === 0) return <p className="muted">Create a pickup for today to start the demo.</p>;

  return (
    <form className="fields demo-sheet-form" action={action}>
      <label>Today’s pickup
        <select name="serviceId" defaultValue={pickups[0].id} required>
          {pickups.map((pickup) => (
            <option key={pickup.id} value={pickup.id}>{pickup.time} · {pickup.client} · {pickup.driver}</option>
          ))}
        </select>
      </label>
      {state.error && <p className="form-feedback error" role="alert">{state.error}</p>}
      <div className="demo-sheet-actions">
        <button className="button primary" type="submit" name="destination" value="driver" disabled={pending}>Driver</button>
        <button className="button mobile-secondary" type="submit" name="destination" value="client" disabled={pending}>Client</button>
      </div>
    </form>
  );
}

export function DemoMenu({ context }: { context: DemoMenuContext }) {
  const [open, setOpen] = useState(false);
  const [pickups, setPickups] = useState<DemoPickup[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const spanish = context.view === "client" && context.language === "es";

  async function loadPickups() {
    setPickups(null);
    setLoadError(false);
    try {
      setPickups(await getDispatchDemoChoices());
    } catch {
      setLoadError(true);
    }
  }

  function show() {
    setOpen(true);
    if (context.view === "dispatch") void loadPickups();
  }

  const close = () => setOpen(false);

  return (
    <>
      <button className="demo-menu-trigger" type="button" aria-haspopup="dialog" onClick={show}>Demo<Icon name="chevronDown" /></button>
      <MobileSheet open={open} onClose={close} title={spanish ? "Vistas de demo" : "Demo views"} closeLabel={spanish ? "Cerrar" : "Close"}>
        {context.view === "dispatch" ? (
          loadError ? (
            <div className="demo-sheet-actions">
              <p className="form-feedback error" role="alert">Could not load today’s pickups.</p>
              <button className="button mobile-secondary" type="button" onClick={loadPickups}>Try again</button>
            </div>
          ) : pickups ? <DispatchChoices pickups={pickups} /> : <p className="muted" role="status">Loading pickups…</p>
        ) : (
          <div className="demo-sheet-actions">
            {context.view === "driver" && <Link className="button primary" href={context.clientHref} prefetch={false} onClick={close}>Open client portal</Link>}
            {context.view === "client" && context.driverHref && <Link className="button primary" href={context.driverHref} prefetch={false} onClick={close}>{spanish ? "Volver al conductor" : "Back to driver"}</Link>}
            {context.view === "client" && context.operator === "dispatch" ? (
              <Link className="button mobile-secondary" href="/dispatch" prefetch={false} onClick={close}>{spanish ? "Volver a Dispatch" : "Back to Dispatch"}</Link>
            ) : (
              <form action={returnToDispatchDemo}><button className="button mobile-secondary" type="submit">{spanish ? "Volver a Dispatch" : "Back to Dispatch"}</button></form>
            )}
          </div>
        )}
      </MobileSheet>
    </>
  );
}
