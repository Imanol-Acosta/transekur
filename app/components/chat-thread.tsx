"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { chatMessageLimit, type ChatMessage } from "../../lib/chat";
import type { ClientLanguage } from "../../lib/client-language";
import { sentTimeLabel } from "../../lib/dominican-time";
import { Icon } from "./icons";

const copy = {
  en: { you: "You", empty: "No messages yet.", message: "Message", send: "Send", sending: "Sending…", error: "Your message could not be sent. Try again.", unavailable: "Chat is temporarily unavailable." },
  es: { you: "Tú", empty: "Todavía no hay mensajes.", message: "Mensaje", send: "Enviar", sending: "Enviando…", error: "No se pudo enviar tu mensaje. Inténtalo de nuevo.", unavailable: "El chat no está disponible por el momento." },
};

export function ChatThread({ title, contact, messages, sender, language, sendAction, inSheet = false }: {
  title: string;
  contact: string;
  messages: ChatMessage[] | null;
  sender: ChatMessage["sender"];
  language: ClientLanguage;
  sendAction: (id: string, body: string) => Promise<boolean>;
  inSheet?: boolean;
}) {
  const router = useRouter();
  const headingId = useId();
  const log = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const requestId = useRef<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, submit, pending] = useActionState(async () => {
    const body = draft.trim();
    if (!body) return false;
    const id = requestId.current ??= crypto.randomUUID();
    try {
      if (!await sendAction(id, body)) return true;
    } catch {
      return true;
    }
    requestId.current = null;
    followLatest.current = true;
    setDraft("");
    router.refresh();
    return false;
  }, false);
  const labels = copy[language];
  const latest = messages?.at(-1);

  useEffect(() => {
    const node = log.current;
    if (node && followLatest.current) node.scrollTop = node.scrollHeight;
  }, [latest?.id, latest?.sender]);

  if (messages === null) {
    return (
      <section className="chat-panel" aria-label={inSheet ? title : undefined} aria-labelledby={inSheet ? undefined : headingId}>
        {!inSheet && <h2 id={headingId}>{title}</h2>}
        <p className="chat-contact muted" role="status">{labels.unavailable}</p>
      </section>
    );
  }

  return (
    <section className="chat-panel" aria-label={inSheet ? title : undefined} aria-labelledby={inSheet ? undefined : headingId}>
      {!inSheet && <h2 id={headingId}>{title}</h2>}
      <p className="chat-contact muted">{contact}</p>
      <div className="chat-log" role="log" aria-label={title} ref={log} tabIndex={0} onScroll={(event) => {
        const node = event.currentTarget;
        followLatest.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
      }}>
        {messages.length === 0 ? <p className="chat-empty muted">{labels.empty}</p> : (
          <ol>
            {messages.map((message) => (
              <li className={message.sender === sender ? "chat-message chat-message-own" : "chat-message"} key={`${message.sender}-${message.id}`}>
                <div className="chat-message-meta">
                  <strong>{message.sender === sender ? labels.you : contact}</strong>
                  <time dateTime={message.created_at}>{sentTimeLabel(message.created_at, language === "es" ? "es-DO" : "en-US")}</time>
                </div>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <form action={submit} className="chat-form">
        <label>{labels.message}
          <textarea rows={2} maxLength={chatMessageLimit} required value={draft} readOnly={pending} onChange={(event) => {
            requestId.current = null;
            setDraft(event.target.value);
          }} />
        </label>
        {error && <p className="form-feedback error" role="alert">{labels.error}</p>}
        <button type="submit" className="button primary" disabled={pending || !draft.trim()}>{pending ? labels.sending : labels.send}<Icon name="send" /></button>
      </form>
    </section>
  );
}
