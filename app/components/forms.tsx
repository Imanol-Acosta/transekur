"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { clientLanguageLabels, defaultClientLanguage } from "../../lib/client-language";
import { demoAccounts, demoDrivers, demoPassword, dispatchAccount, getDriver } from "../../lib/demo-accounts";
import { addService, notifyClient, signIn, type ActionState } from "../actions";
import { Icon } from "./icons";

function FormFeedback({ state }: { state: ActionState }) {
  if (state.error) return <p className="form-feedback error" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-feedback success" role="status">{state.success}</p>;
  return null;
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <form action={action} className="fields sign-in-form">
        <label>Email<input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required placeholder={dispatchAccount.email} /></label>
        <label>Password<input name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required placeholder="Demo password" /></label>
        <FormFeedback state={state} />
        <button className="button primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}<Icon name="arrow" /></button>
      </form>
      <div className="demo-accounts">
        <span className="eyebrow">Fill demo credentials</span>
        <div className="account-options">
          {demoAccounts.map((account) => (
            <button className="demo-account" type="button" key={account.id} onClick={() => { setEmail(account.email); setPassword(demoPassword); }}>
              <span>{account.role === "dispatch" ? "Dispatch" : "Driver"}</span>
              <strong>{account.name}</strong>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function NewServiceFields({ day, pending }: { day: string; pending: boolean }) {
  const [values, setValues] = useState({
    clientName: "",
    phone: "",
    clientLanguage: defaultClientLanguage,
    pickupPoint: "",
    pickupDate: day,
    pickupTime: "",
    driverId: "",
  });
  const driver = getDriver(values.driverId);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.currentTarget;
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  return (
    <>
      <label>Client name<input name="clientName" value={values.clientName} onChange={updateField} maxLength={80} placeholder="e.g. Ana Castillo" required disabled={pending} /></label>
      <label>Phone number<input name="phone" value={values.phone} onChange={updateField} type="tel" maxLength={28} placeholder="e.g. +1 809 555 0100" required disabled={pending} /></label>
      <label>
        Client notice language
        <select name="clientLanguage" value={values.clientLanguage} onChange={updateField} required disabled={pending}>
          <option value="es">{clientLanguageLabels.es} (default)</option>
          <option value="en">{clientLanguageLabels.en}</option>
        </select>
      </label>
      <label>Pickup point<input name="pickupPoint" value={values.pickupPoint} onChange={updateField} maxLength={180} placeholder="e.g. Punta Cana Airport, Terminal B" required disabled={pending} /></label>
      <div className="field-pair">
        <label>Pickup date<input name="pickupDate" value={values.pickupDate} onChange={updateField} type="date" required disabled={pending} /></label>
        <label>Local time<input name="pickupTime" value={values.pickupTime} onChange={updateField} type="time" required disabled={pending} /></label>
      </div>
      <label>Assign driver<select name="driverId" value={values.driverId} onChange={updateField} required disabled={pending}>
        <option value="" disabled>Choose a driver</option>
        {demoDrivers.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
      </select></label>
      {driver && <p className="vehicle-note"><Icon name="car" />{driver.vehicle} · {driver.plate}</p>}
    </>
  );
}

export function NewServiceForm({ day }: { day: string }) {
  const [state, action, pending] = useActionState(addService, {});

  return (
    <form action={action} className="fields">
      <NewServiceFields key={state.lastCreatedServiceId ?? "new-service"} day={day} pending={pending} />
      <FormFeedback state={state} />
      <button className="button primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create service"}<Icon name="plus" /></button>
    </form>
  );
}

export function NotifyForm({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState(notifyClient, {});
  return (
    <form action={action} className="notify-form">
      <input name="serviceId" value={serviceId} type="hidden" />
      <FormFeedback state={state} />
      <button className="button primary" type="submit" disabled={pending || Boolean(state.success)}>{pending ? "Sending…" : "10 min away"}<Icon name="send" /></button>
    </form>
  );
}
