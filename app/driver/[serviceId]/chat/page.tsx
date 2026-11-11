import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "../../../../lib/demo-session";
import { getDriverChat } from "../../../../lib/demo-store";
import { dominicanDay } from "../../../../lib/dominican-time";
import { postDriverChat } from "../../../actions";
import { AutoRefresh } from "../../../components/auto-refresh";
import { Header } from "../../../components/brand";
import { ChatThread } from "../../../components/chat-thread";
import { Icon } from "../../../components/icons";

export const metadata: Metadata = { title: "Client chat" };

export default async function DriverChatPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const account = await requireRole("driver");
  const { serviceId } = await params;
  const chat = await getDriverChat(serviceId, account.id, dominicanDay());
  if (!chat) notFound();

  return (
    <>
      <Header account={account} />
      <AutoRefresh />
      <main className="workspace driver-workspace driver-chat-workspace">
        <Link className="text-link back-to-pickups" href="/driver">Back to pickups</Link>
        <h1>Client conversation</h1>
        <p className="driver-pickup"><Icon name="pin" />{chat.service.pickup_point}</p>
        <ChatThread title="Chat with client" contact={chat.service.client_name} messages={chat.messages} sender="driver" language="en" sendAction={postDriverChat.bind(null, serviceId)} />
      </main>
    </>
  );
}
