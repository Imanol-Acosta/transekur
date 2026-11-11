import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAccount } from "../../../lib/demo-session";
import { getClientPortal, getDemoPickup } from "../../../lib/demo-store";
import { dominicanDay, sentTimeLabel } from "../../../lib/dominican-time";
import { postClientChat } from "../../actions";
import { AutoRefresh } from "../../components/auto-refresh";
import { ArrivalToast } from "../../components/arrival-toast";
import { Header } from "../../components/brand";
import { ClientChatLauncher } from "../../components/chat-launcher";
import { ChatThread } from "../../components/chat-thread";
import { Icon } from "../../components/icons";

export const metadata: Metadata = { title: "Client portal", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const copy = {
  en: {
    portal: "Client portal", inbox: "Notification inbox", onTheWay: "Your driver is on the way", waiting: "Waiting for an update",
    empty: "Your driver’s arrival notice will appear here.", driver: "Driver", vehicle: "Vehicle", sentAt: "Sent at", chat: "Chat with your driver", dismiss: "Dismiss arrival notice",
  },
  es: {
    portal: "Portal del cliente", inbox: "Bandeja de notificaciones", onTheWay: "Tu conductor está en camino", waiting: "Esperando una actualización",
    empty: "Aquí aparecerá el aviso de llegada de tu conductor.", driver: "Conductor", vehicle: "Vehículo", sentAt: "Enviado a las", chat: "Chat con tu conductor", dismiss: "Cerrar aviso de llegada",
  },
};

export default async function ClientPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ demo?: string }> }) {
  const { token } = await params;
  const portal = await getClientPortal(token);
  if (!portal) notFound();
  const language = portal.client_language;
  const labels = copy[language];
  const operator = (await searchParams).demo === "1" ? await currentAccount() : undefined;
  const demoPickup = operator ? await getDemoPickup(dominicanDay(), { token }) : null;

  return (
    <>
      <Header clientLabel={labels.portal} demo={operator && demoPickup ? {
        view: "client",
        operator: operator.role,
        language,
        driverHref: operator.role === "driver" ? `/driver?service=${demoPickup.id}` : undefined,
      } : undefined} />
      <AutoRefresh />
      <main className="client-workspace" lang={language}>
        {portal.sent_at && portal.message && <ArrivalToast key={`${token}-${portal.sent_at}`} title={labels.onTheWay} message={portal.message} closeLabel={labels.dismiss} />}
        <section className="client-receipt" aria-labelledby="inbox-title">
          <div className="inbox-heading"><div className="receipt-icon"><Icon name="bell" /></div><h1 id="inbox-title">{labels.inbox}</h1></div>
          <h2>{portal.sent_at ? labels.onTheWay : labels.waiting}</h2>
          {portal.sent_at ? (
            <>
              <p className="receipt-message">{portal.message}</p>
              <dl className="receipt-details"><div><dt>{labels.driver}</dt><dd>{portal.driver_name}</dd></div><div><dt>{labels.vehicle}</dt><dd>{portal.vehicle}<small>{portal.plate}</small></dd></div></dl>
              <p className="receipt-timestamp"><Icon name="check" />{labels.sentAt} <time dateTime={portal.sent_at}>{sentTimeLabel(portal.sent_at, language === "es" ? "es-DO" : "en-US")}</time></p>
            </>
          ) : <p className="muted">{labels.empty}</p>}
        </section>
        <ClientChatLauncher language={language}>
          <ChatThread key={token} title={labels.chat} contact={portal.driver_name ?? labels.driver} messages={portal.chat_messages} sender="client" language={language} sendAction={postClientChat.bind(null, token)} inSheet />
        </ClientChatLauncher>
      </main>
    </>
  );
}
