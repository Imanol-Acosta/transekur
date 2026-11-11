import type { Metadata } from "next";
import { clientLanguageLabels } from "../../lib/client-language";
import { getDriver } from "../../lib/demo-accounts";
import { requireRole } from "../../lib/demo-session";
import { listDispatchServices } from "../../lib/demo-store";
import { dateLabel, dominicanDay, pickupTimeLabel, sentTimeLabel } from "../../lib/dominican-time";
import { AutoRefresh } from "../components/auto-refresh";
import { Header } from "../components/brand";
import { NewServiceForm } from "../components/forms";
import { Icon } from "../components/icons";

export const metadata: Metadata = { title: "Dispatch" };

export default async function DispatchPage() {
  const account = await requireRole("dispatch");
  const services = await listDispatchServices();
  const sent = services.filter((service) => service.sentAt).length;
  const day = dominicanDay();

  return (
    <>
      <Header account={account} />
      <AutoRefresh />
      <main className="workspace dispatch-workspace">
        <div className="page-intro">
          <div><h1>Service board</h1><p className="muted">Assign pickups and track client notices.</p></div>
          <p className="date-chip"><Icon name="clock" /><span>{dateLabel(day)}<small>Santo Domingo time</small></span></p>
        </div>
        <dl className="metrics">
          <div><dt>Total services</dt><dd>{services.length}</dd></div>
          <div><dt>Awaiting notice</dt><dd>{services.length - sent}</dd></div>
          <div><dt>Notices sent</dt><dd>{sent}</dd></div>
        </dl>
        <div className="dispatch-grid">
          <section className="service-board" aria-labelledby="services-title">
            <div className="section-heading"><h2 id="services-title">Scheduled services</h2><a className="text-link new-service-link" href="#new-service"><Icon name="plus" />New service</a></div>
            {services.length === 0 ? (
              <div className="empty-state"><Icon name="list" /><h3>No services yet</h3><p>Create a pickup and assign it to one of the demo drivers.</p></div>
            ) : (
              <ul className="service-list">
                {services.map((service) => {
                  const driver = getDriver(service.driverId);
                  return (
                    <li className="service-card" key={service.id}>
                      <div className="service-card-top">
                        <div>
                          <span className="reference">TK-{service.id.slice(0, 6).toUpperCase()}</span>
                          <h3>{service.clientName}</h3>
                          <p className="muted">{service.phone} · {clientLanguageLabels[service.clientLanguage]} notice</p>
                        </div>
                        <span className={`status ${service.sentAt ? "sent" : "waiting"}`}>{service.sentAt ? "Sent (simulated)" : "Awaiting notice"}</span>
                      </div>
                      <div className="service-details">
                        <p><Icon name="pin" />{service.pickupPoint}</p>
                        <p><Icon name="clock" />{dateLabel(service.pickupDate, "short")} · {pickupTimeLabel(service.pickupTime)}</p>
                        <p><Icon name="car" /><span>{driver?.name}<small>{driver?.vehicle} · {driver?.plate}</small></span></p>
                      </div>
                      {service.sentAt && <div className="notice-log"><time dateTime={service.sentAt}>{sentTimeLabel(service.sentAt)}</time><p>{service.message}</p></div>}
                      <a className="text-link preview-link" href={`/client/${service.clientToken}`} target="_blank" rel="noreferrer">Client preview<Icon name="external" /></a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section id="new-service" className="new-service-panel" aria-labelledby="new-service-title">
            <h2 id="new-service-title">New service</h2>
            <p className="muted">Use fictional client details for this demo.</p>
            <NewServiceForm day={day} />
          </section>
        </div>
      </main>
    </>
  );
}
