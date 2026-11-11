import { supabasePublic, supabaseServer } from "./supabase-server";
import { defaultClientLanguage, type ClientLanguage } from "./client-language";
import { isUuid, type ChatMessage } from "./chat";

type NewService = {
  clientName: string;
  phone: string;
  clientLanguage: ClientLanguage;
  pickupDate: string;
  pickupTime: string;
  pickupPoint: string;
  driverId: string;
};

type ServiceRow = {
  id: string;
  client_name: string;
  phone: string;
  client_language: ClientLanguage;
  pickup_date: string;
  pickup_time: string;
  pickup_point: string;
  driver_id: string;
  client_token: string;
  notice: { sent_at: string; message: string } | null;
};

type ClientNoticeRow = {
  message: string | null;
  sent_at: string | null;
  driver_name: string | null;
  vehicle: string | null;
  plate: string | null;
};

type ClientPortalRow = ClientNoticeRow & {
  client_language: ClientLanguage;
  chat_messages: ChatMessage[];
};

const serviceColumns = `
  id, client_name, phone, client_language, pickup_date, pickup_time, pickup_point, driver_id, client_token,
  notice:transekur_notices(sent_at, message)
`;

function serviceFromRow(row: ServiceRow) {
  return {
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    clientLanguage: row.client_language,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time.slice(0, 5),
    pickupPoint: row.pickup_point,
    driverId: row.driver_id,
    clientToken: row.client_token,
    sentAt: row.notice?.sent_at ?? null,
    message: row.notice?.message ?? null,
  };
}

export async function createService(service: NewService) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("transekur_services").insert({
    client_name: service.clientName,
    phone: service.phone,
    client_language: service.clientLanguage,
    pickup_date: service.pickupDate,
    pickup_time: service.pickupTime,
    pickup_point: service.pickupPoint,
    driver_id: service.driverId,
  }).select("id").single().overrideTypes<{ id: string }, { merge: false }>();
  if (error) throw error;
  return data.id;
}

export async function listDispatchServices() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("transekur_services").select(serviceColumns)
    .order("pickup_date", { ascending: false }).order("pickup_time").order("created_at", { ascending: false })
    .overrideTypes<ServiceRow[], { merge: false }>();
  if (error) throw error;
  return data.map(serviceFromRow);
}

export async function listDriverServices(driverId: string, day: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("transekur_services").select(serviceColumns)
    .eq("driver_id", driverId).eq("pickup_date", day).order("pickup_time").order("created_at", { ascending: false })
    .overrideTypes<ServiceRow[], { merge: false }>();
  if (error) throw error;
  return data.map(serviceFromRow);
}

export async function listDemoPickups(day: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("transekur_services")
    .select("id, client_name, pickup_time, driver_id").eq("pickup_date", day)
    .order("created_at", { ascending: false })
    .overrideTypes<Pick<ServiceRow, "id" | "client_name" | "pickup_time" | "driver_id">[], { merge: false }>();
  if (error) throw new Error("Could not load demo pickups", { cause: error });
  return data;
}

export async function getDemoPickup(day: string, lookup: { id: string } | { token: string }) {
  const supabase = await supabaseServer();
  const query = supabase.from("transekur_services").select("id, client_token, driver_id").eq("pickup_date", day);
  const pickup = "id" in lookup ? query.eq("id", lookup.id) : query.eq("client_token", lookup.token);
  const { data, error } = await pickup.maybeSingle()
    .overrideTypes<Pick<ServiceRow, "id" | "client_token" | "driver_id"> | null, { merge: false }>();
  if (error) throw new Error("Could not load the selected demo pickup", { cause: error });
  return data;
}

export async function sendServiceNotice(serviceId: string) {
  if (!isUuid(serviceId)) return false;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("transekur_send_notice", { p_service_id: serviceId });
  if (error) throw error;
  return data === true;
}

export async function getClientPortal(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return undefined;
  const supabase = supabasePublic();
  const { data, error } = await supabase.rpc("transekur_client_portal", { p_token: token })
    .maybeSingle().overrideTypes<ClientPortalRow | null, { merge: false }>();
  if (!error) return data;
  if (error.code !== "PGRST202") throw new Error(`Could not load the client portal: ${error.message}`, { cause: error });

  // Keep existing links usable while the chat migration is rolling out.
  const { data: notice, error: noticeError } = await supabase.rpc("transekur_client_notice", { p_token: token })
    .maybeSingle().overrideTypes<ClientNoticeRow | null, { merge: false }>();
  if (noticeError) throw new Error(`Could not load the client notice: ${noticeError.message}`, { cause: noticeError });
  if (!notice) return null;
  const language: ClientLanguage = notice.message?.startsWith("Hi ") ? "en" : defaultClientLanguage;
  return { ...notice, client_language: language, chat_messages: null };
}

export async function getDriverChat(serviceId: string, driverId: string, day: string) {
  if (!isUuid(serviceId)) return undefined;
  const supabase = await supabaseServer();
  const { data: service, error: serviceError } = await supabase.from("transekur_services")
    .select("client_name, pickup_point").eq("id", serviceId).eq("driver_id", driverId).eq("pickup_date", day)
    .maybeSingle().overrideTypes<{ client_name: string; pickup_point: string } | null, { merge: false }>();
  if (serviceError) throw new Error(`Could not load the pickup for chat: ${serviceError.message}`, { cause: serviceError });
  if (!service) return undefined;

  const { data: messages, error } = await supabase.from("transekur_chat_messages")
    .select("id, sender, body, created_at").eq("service_id", serviceId)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).order("sender", { ascending: false })
    .limit(100).overrideTypes<ChatMessage[], { merge: false }>();
  if (!error) return { service, messages: messages.reverse() };
  if (error.code === "PGRST205" || error.code === "42P01") return { service, messages: null };
  throw new Error(`Could not load the conversation: ${error.message}`, { cause: error });
}

export async function sendClientChat(token: string, id: string, body: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return false;
  const { data, error } = await supabasePublic().rpc("transekur_send_client_chat", { p_token: token, p_id: id, p_body: body });
  if (error) throw error;
  return data === true;
}

export async function sendDriverChat(serviceId: string, id: string, body: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("transekur_chat_messages")
    .upsert({ service_id: serviceId, sender: "driver", id, body }, {
      onConflict: "service_id,sender,id",
      ignoreDuplicates: true,
    });
  if (error) throw error;
}
