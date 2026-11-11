import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "../../lib/demo-session";
import { getDriverChat, listDriverServices } from "../../lib/demo-store";
import { dateLabel, dominicanDay, pickupTimeLabel, sentTimeLabel } from "../../lib/dominican-time";
import { AutoRefresh } from "../components/auto-refresh";
import { Header } from "../components/brand";
import { DriverChatLauncher } from "../components/chat-launcher";
import { ChatThread } from "../components/chat-thread";
import { NotifyForm } from "../components/forms";
import { Icon } from "../components/icons";
import { postDriverChat } from "../actions";

export const metadata: Metadata = { title: "Driver" };

export default async function DriverPage({ searchParams }: { searchParams: Promise<{ service?: string; chat?: string }> }) {
  const account = await requireRole("driver");
  const day = dominicanDay();
  const query = await searchParams;
  const chatId = typeof query.chat === "string" ? query.chat : undefined;
  const services = await listDriverServices(account.id, day);
  const selected = services.find((pickup) => pickup.id === query.service);
  const chat = chatId ? await getDriverChat(chatId, account.id, day) : null;
  if (chatId && !chat) notFound();

  return (
    <>
      <Header account={account} demo={selected ? { view: "driver", clientHref: `/client/${selected.clientToken}?demo=1` } : undefined} />
      <AutoRefresh />
      <main className="workspace driver-workspace">
        <div className="page-intro driver-intro"><div><span className="eyebrow">{dateLabel(day)}</span><h1>Today’s pickups</h1><p className="muted">{account.name} · Santo Domingo time</p></div></div>
        <div className="driver-vehicle"><Icon name="car" /><p><strong>{account.vehicle}</strong><span>{account.plate}</span></p></div>
        {services.length === 0 ? (
          <div className="empty-state"><Icon name="list" /><h2>No pickups today</h2><p>Services assigned to you for today will appear here.</p></div>
        ) : (
          <ul className="driver-list">
            {services.map((service) => (
              <li className={service.id === selected?.id ? "driver-card driver-card-selected" : "driver-card"} key={service.id}>
                <div className="driver-card-top"><time className="pickup-clock" dateTime={`${service.pickupDate}T${service.pickupTime}-04:00`}>{pickupTimeLabel(service.pickupTime)}</time><span className="reference">TK-{service.id.slice(0, 6).toUpperCase()}</span></div>
                <h2>{service.clientName}</h2>
                <p className="driver-pickup"><Icon name="pin" />{service.pickupPoint}</p>
                {service.sentAt ? <div className="driver-sent"><Icon name="check" /><span><strong>Sent to inbox</strong><time dateTime={service.sentAt}>{sentTimeLabel(service.sentAt)}</time></span></div> : <NotifyForm serviceId={service.id} />}
              </li>
            ))}
          </ul>
        )}
        <DriverChatLauncher pickups={services.map((pickup) => ({ id: pickup.id, client: pickup.clientName, time: pickupTimeLabel(pickup.pickupTime) }))} preferredId={selected?.id} conversationId={chatId}>
          {chat && chatId && <ChatThread key={chatId} title="Chat with client" contact={chat.service.client_name} messages={chat.messages} sender="driver" language="en" sendAction={postDriverChat.bind(null, chatId)} inSheet />}
        </DriverChatLauncher>
      </main>
    </>
  );
}
