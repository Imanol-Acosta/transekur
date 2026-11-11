"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chatMessageLimit, isUuid } from "../lib/chat";
import { defaultClientLanguage } from "../lib/client-language";
import { demoPassword, getDriver } from "../lib/demo-accounts";
import { endSession, requireRole, startSession } from "../lib/demo-session";
import { createService, getDemoPickup, listDemoPickups, sendClientChat, sendDriverChat, sendServiceNotice } from "../lib/demo-store";
import { dominicanDay, pickupTimeLabel } from "../lib/dominican-time";

export type ActionState = { error?: string; success?: string };
type ServiceActionState = ActionState & { lastCreatedServiceId?: string };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = field(formData, "email").toLowerCase();
  const password = formData.get("password");
  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter a demo email and password from the list below." };
  }
  let account;
  try {
    account = await startSession(email, password);
  } catch {
    return { error: "Could not start a session. Please try again." };
  }
  if (!account) return { error: "Enter a demo email and password from the list below." };
  redirect(`/${account.role}`);
}

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function getDispatchDemoChoices() {
  await requireRole("dispatch");
  const services = await listDemoPickups(dominicanDay());
  return services.map((service) => ({
    id: service.id,
    client: service.client_name,
    driver: getDriver(service.driver_id)?.name,
    time: pickupTimeLabel(service.pickup_time.slice(0, 5)),
  }));
}

export async function openDispatchDemo(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("dispatch");
  const id = field(formData, "serviceId");
  const destination = field(formData, "destination");
  if (!isUuid(id) || (destination !== "driver" && destination !== "client")) {
    return { error: "Choose a pickup and a demo view." };
  }

  let href: string;
  try {
    const pickup = await getDemoPickup(dominicanDay(), { id });
    if (!pickup) return { error: "This pickup is no longer available for today." };
    if (destination === "client") {
      href = `/client/${pickup.client_token}?demo=1`;
    } else {
      const driver = getDriver(pickup.driver_id);
      if (!driver) return { error: "This pickup has no demo driver." };
      const account = await startSession(driver.email, demoPassword);
      if (account?.id !== driver.id) return { error: "Could not sign in as the assigned driver." };
      href = `/driver?service=${pickup.id}`;
    }
  } catch {
    return { error: "Could not open the demo view. Please try again." };
  }
  redirect(href);
}

export async function returnToDispatchDemo() {
  await requireRole("driver");
  await endSession();
  redirect("/?account=dispatch");
}

export async function addService(state: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  await requireRole("dispatch");
  const fail = (error: string) => ({ error, lastCreatedServiceId: state.lastCreatedServiceId });
  const clientName = field(formData, "clientName");
  const phone = field(formData, "phone");
  const pickupPoint = field(formData, "pickupPoint");
  const pickupDate = field(formData, "pickupDate");
  const pickupTime = field(formData, "pickupTime");
  const driverId = field(formData, "driverId");
  const clientLanguage = field(formData, "clientLanguage") || defaultClientLanguage;

  if (!clientName || clientName.length > 80 || !pickupPoint || pickupPoint.length > 180) {
    return fail("Enter a client name and pickup point within the field limits.");
  }
  const digits = phone.replace(/\D/g, "");
  if (phone.length > 28 || !/^\+?[\d ().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    return fail("Enter a phone number with 7 to 15 digits.");
  }
  if (!isDate(pickupDate) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
    return fail("Choose a valid pickup date and time.");
  }
  if (!getDriver(driverId)) return fail("Choose a driver from the list.");
  if (clientLanguage !== "es" && clientLanguage !== "en") {
    return fail("Choose Spanish or English for the client notice.");
  }

  let serviceId: string;
  try {
    serviceId = await createService({ clientName, phone, pickupPoint, pickupDate, pickupTime, driverId, clientLanguage });
  } catch {
    return fail("The service could not be saved. Please try again.");
  }
  revalidatePath("/dispatch");
  return { success: "Service created and assigned.", lastCreatedServiceId: serviceId };
}

export async function notifyClient(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("driver");
  try {
    if (!await sendServiceNotice(field(formData, "serviceId"))) {
      return { error: "This service is unavailable in your schedule for today." };
    }
  } catch {
    return { error: "The notice could not be saved. Please try again." };
  }
  revalidatePath("/driver");
  return { success: "Notice sent to the client inbox." };
}

export async function postClientChat(token: string, id: string, message: string): Promise<boolean> {
  const body = typeof message === "string" ? message.trim() : "";
  if (typeof token !== "string" || typeof id !== "string" || !isUuid(id) || !body || body.length > chatMessageLimit) return false;
  try {
    return await sendClientChat(token, id, body);
  } catch {
    return false;
  }
}

export async function postDriverChat(serviceId: string, id: string, message: string): Promise<boolean> {
  await requireRole("driver");
  const body = typeof message === "string" ? message.trim() : "";
  if (typeof serviceId !== "string" || typeof id !== "string" || !isUuid(id) || !isUuid(serviceId) || !body || body.length > chatMessageLimit) return false;
  try {
    await sendDriverChat(serviceId, id, body);
    return true;
  } catch {
    return false;
  }
}
