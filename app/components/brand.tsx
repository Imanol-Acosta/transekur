import Image from "next/image";
import type { DemoAccount } from "../../lib/demo-accounts";
import { signOut } from "../actions";

export function Brand() {
  return (
    <div className="brand">
      <Image className="brand-mark" src="/transekur-mark.png" alt="" width={36} height={36} unoptimized />
      <div><strong>Transekur</strong><span>Arrival Desk</span></div>
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
