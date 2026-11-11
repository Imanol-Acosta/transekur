"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { ClientLanguage } from "../../lib/client-language";
import { Icon } from "./icons";
import { MobileSheet } from "./mobile-sheet";

function ChatButton({ label, onClick, pending = false }: { label: string; onClick: () => void; pending?: boolean }) {
  return <button className="floating-chat" type="button" aria-label={label} aria-haspopup="dialog" aria-busy={pending} disabled={pending} onClick={onClick}><Icon name="chat" /></button>;
}

export function ClientChatLauncher({ language, children }: { language: ClientLanguage; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const spanish = language === "es";
  return (
    <>
      <ChatButton label={spanish ? "Abrir chat con tu conductor" : "Open chat with your driver"} onClick={() => setOpen(true)} />
      <MobileSheet title={spanish ? "Chat con tu conductor" : "Chat with your driver"} closeLabel={spanish ? "Cerrar" : "Close"} open={open} onClose={() => setOpen(false)}>
        {children}
      </MobileSheet>
    </>
  );
}

export function DriverChatLauncher({ pickups, preferredId, conversationId, children }: {
  pickups: { id: string; client: string; time: string }[];
  preferredId?: string;
  conversationId?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [pending, startTransition] = useTransition();
  const baseHref = preferredId ? `/driver?service=${preferredId}` : "/driver";

  function select(id: string) {
    const query = new URLSearchParams({ chat: id });
    if (preferredId) query.set("service", preferredId);
    startTransition(() => router.push(`/driver?${query}`, { scroll: false }));
  }

  function show() {
    const id = preferredId ?? (pickups.length === 1 ? pickups[0].id : undefined);
    if (id) select(id);
    else setChoosing(true);
  }

  function close() {
    setChoosing(false);
    if (conversationId) router.replace(baseHref, { scroll: false });
  }

  if (pickups.length === 0) return null;

  return (
    <>
      <ChatButton label="Open client chat" onClick={show} pending={pending} />
      <MobileSheet title={conversationId ? "Chat with client" : "Choose a conversation"} open={Boolean(conversationId) || choosing} onClose={close}>
        {conversationId ? children : (
          <ul className="chat-choices">
            {pickups.map((pickup) => (
              <li key={pickup.id}>
                <button type="button" disabled={pending} onClick={() => select(pickup.id)}>
                  <strong>{pickup.client}</strong><span className="muted">{pickup.time}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </MobileSheet>
    </>
  );
}
