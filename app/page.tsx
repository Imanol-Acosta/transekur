import { redirect } from "next/navigation";
import { currentAccount } from "../lib/demo-session";
import { Brand } from "./components/brand";
import { SignInForm } from "./components/forms";

export default async function Home() {
  const account = await currentAccount();
  if (account) redirect(`/${account.role}`);

  return (
    <main className="sign-in-layout">
      <section className="sign-in-brand">
        <Brand />
        <div className="sign-in-intro">
          <span className="eyebrow light-accent">Private transport · Operations</span>
          <h1>Arrival<br />Desk<span>.</span></h1>
          <p>Coordinate pickups and let clients know when their driver is ten minutes away.</p>
        </div>
        <svg className="route-illustration" viewBox="0 0 620 230" fill="none" aria-hidden="true">
          <path d="M-30 208H224C268 208 288 180 288 149V104C288 68 319 44 356 44H651" />
          <path d="M-30 185H224C251 185 265 170 265 149V104C265 56 306 21 356 21H651" />
          <path d="M-30 231H224C282 231 311 194 311 149V104C311 81 332 67 356 67H651" />
          <circle cx="414" cy="44" r="14" className="route-marker" />
          <circle cx="414" cy="44" r="4" className="route-center" />
        </svg>
        <p className="sign-in-caption">Santo Domingo, Dominican Republic</p>
      </section>
      <section className="sign-in-panel" aria-labelledby="sign-in-title">
        <div className="sign-in-content">
          <span className="eyebrow">Demo workspace</span>
          <h2 id="sign-in-title">Sign in</h2>
          <p className="muted">Choose a demo account below or enter its credentials.</p>
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
