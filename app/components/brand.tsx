import type { DemoAccount } from "../../lib/demo-accounts";
import { signOut } from "../actions";

export function Brand() {
  return (
    <div className="brand">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
        <rect x=".5" y=".5" width="37" height="37" rx="10" stroke="currentColor" opacity=".5" />
        <path d="M10 26h5.2c2.2 0 4-1.8 4-4v-6c0-2.2 1.8-4 4-4H28M14 30h2.2c3.9 0 7-3.1 7-7v-6c0-.6.4-1 1-1H28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="28" cy="12" r="2" fill="currentColor" />
      </svg>
      <div><strong>TRANSEKUR</strong><span>ARRIVAL DESK</span></div>
    </div>
  );
}

export function Header({ account }: { account?: DemoAccount }) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Brand />
        {account ? (
          <div className="header-actions">
            <span className="header-role">{account.role === "dispatch" ? "Dispatch" : "Driver"}</span>
            <form action={signOut}><button className="sign-out" type="submit">Sign out</button></form>
          </div>
        ) : <span className="header-role">Client preview</span>}
      </div>
    </header>
  );
}
