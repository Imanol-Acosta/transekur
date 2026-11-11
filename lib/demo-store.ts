import { supabasePublic, supabaseServer } from "./supabase-server";
import type { ClientLanguage } from "./client-language";

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

type PreviewRow = {
  message: string | null;
  sent_at: string | null;
  driver_name: string | null;
  vehicle: string | null;
  plate: string | null;
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

export async function sendServiceNotice(serviceId: string) {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(serviceId)) return false;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("transekur_send_notice", { p_service_id: serviceId });
  if (error) throw error;
  return data === true;
}

export async function getClientNotice(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return undefined;
  const { data, error } = await supabasePublic().rpc("transekur_client_notice", { p_token: token })
    .maybeSingle().overrideTypes<PreviewRow | null, { merge: false }>();
  if (error) throw error;
  if (!data) return undefined;
  return { message: data.message, sentAt: data.sent_at, driverName: data.driver_name, vehicle: data.vehicle, plate: data.plate };
}
