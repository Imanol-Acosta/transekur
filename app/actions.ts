"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { defaultClientLanguage } from "../lib/client-language";
import { getDriver } from "../lib/demo-accounts";
import { endSession, requireRole, startSession } from "../lib/demo-session";
import { createService, sendServiceNotice } from "../lib/demo-store";

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
  return { success: "Client notice recorded." };
}
