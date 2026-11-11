import Image from "next/image";
import type { DemoAccount } from "../../lib/demo-accounts";
import { signOut } from "../actions";
import { DemoMenu, type DemoMenuContext } from "./demo-menu";

export function Brand() {
  return (
    <div className="brand">
      <Image className="brand-mark" src="/transekur-mark.png" alt="" width={36} height={36} unoptimized />
      <div><strong>Transekur</strong><span>Arrival Desk</span></div>
    </div>
  );
}

export function Header({ account, clientLabel = "Client portal", demo }: {
  account?: DemoAccount;
  clientLabel?: string;
  demo?: DemoMenuContext;
}) {
  const menu = account?.role === "dispatch" ? { view: "dispatch" } as const : demo;
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Brand />
        <div className={menu ? "header-actions header-actions-with-demo" : "header-actions"}>
          <span className="header-role">{account ? (account.role === "dispatch" ? "Dispatch" : "Driver") : clientLabel}</span>
          {menu && <DemoMenu context={menu} />}
          {account && <form action={signOut}><button className="sign-out" type="submit">Sign out</button></form>}
        </div>
      </div>
    </header>
  );
}
