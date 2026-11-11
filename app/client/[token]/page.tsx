import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientNotice } from "../../../lib/demo-store";
import { sentTimeLabel } from "../../../lib/dominican-time";
import { AutoRefresh } from "../../components/auto-refresh";
import { Header } from "../../components/brand";
import { Icon } from "../../components/icons";

export const metadata: Metadata = { title: "Client notice", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const notice = await getClientNotice(token);
  if (!notice) notFound();

  return (
    <>
      <Header />
      {!notice.sentAt && <AutoRefresh />}
      <main className="client-workspace">
        <article className="client-receipt">
          <div className="receipt-icon"><Icon name={notice.sentAt ? "car" : "clock"} /></div>
          <span className="eyebrow">Simulated client notification</span>
          <h1>{notice.sentAt ? "Your driver is on the way" : "Waiting for an update"}</h1>
          {notice.sentAt ? (
            <>
              <p className="receipt-message">{notice.message}</p>
              <dl className="receipt-details"><div><dt>Driver</dt><dd>{notice.driverName}</dd></div><div><dt>Vehicle</dt><dd>{notice.vehicle}<small>{notice.plate}</small></dd></div></dl>
              <p className="receipt-timestamp"><Icon name="check" />Sent at <time dateTime={notice.sentAt}>{sentTimeLabel(notice.sentAt)}</time></p>
            </>
          ) : <p className="receipt-message">Your driver’s arrival notice will appear here when it is sent.</p>}
        </article>
      </main>
    </>
  );
}
