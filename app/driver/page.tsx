import type { Metadata } from "next";
import { requireRole } from "../../lib/demo-session";
import { listDriverServices } from "../../lib/demo-store";
import { dateLabel, dominicanDay, pickupTimeLabel, sentTimeLabel } from "../../lib/dominican-time";
import { AutoRefresh } from "../components/auto-refresh";
import { Header } from "../components/brand";
import { NotifyForm } from "../components/forms";
import { Icon } from "../components/icons";

export const metadata: Metadata = { title: "Driver" };

export default async function DriverPage() {
  const account = await requireRole("driver");
  const day = dominicanDay();
  const services = await listDriverServices(account.id, day);

  return (
    <>
      <Header account={account} />
      <AutoRefresh />
      <main className="workspace driver-workspace">
        <div className="page-intro driver-intro"><div><span className="eyebrow">{dateLabel(day)}</span><h1>Today’s pickups</h1><p className="muted">{account.name} · Santo Domingo time</p></div></div>
        <div className="driver-vehicle"><Icon name="car" /><p><strong>{account.vehicle}</strong><span>{account.plate}</span></p></div>
        {services.length === 0 ? (
          <div className="empty-state"><Icon name="list" /><h2>No pickups today</h2><p>Services assigned to you for today will appear here.</p></div>
        ) : (
          <ul className="driver-list">
            {services.map((service) => (
              <li className="driver-card" key={service.id}>
                <div className="driver-card-top"><time className="pickup-clock" dateTime={`${service.pickupDate}T${service.pickupTime}-04:00`}>{pickupTimeLabel(service.pickupTime)}</time><span className="reference">TK-{service.id.slice(0, 6).toUpperCase()}</span></div>
                <h2>{service.clientName}</h2>
                <p className="driver-pickup"><Icon name="pin" />{service.pickupPoint}</p>
                {service.sentAt ? <div className="driver-sent"><Icon name="check" /><span><strong>Sent — simulated</strong><time dateTime={service.sentAt}>{sentTimeLabel(service.sentAt)}</time></span></div> : <NotifyForm serviceId={service.id} />}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
