import { redirect } from "next/navigation";
import { demoAccounts, type DemoAccount, type Role } from "./demo-accounts";
import { supabaseServer } from "./supabase-server";

async function accountFor(client: Awaited<ReturnType<typeof supabaseServer>>, userId: string) {
  const { data, error } = await client.from("transekur_accounts").select("id, role").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Could not load the demo profile: ${error.message}`);
  return demoAccounts.find((account) => account.id === data?.id && account.role === data.role);
}

export async function currentAccount() {
  const client = await supabaseServer();
  const { data } = await client.auth.getClaims();
  return data?.claims.sub ? accountFor(client, data.claims.sub) : undefined;
}

export async function requireRole<T extends Role>(role: T) {
  const account = await currentAccount();
  if (!account) redirect("/");
  if (account.role !== role) redirect(`/${account.role}`);
  return account as Extract<DemoAccount, { role: T }>;
}

export async function startSession(email: string, password: string) {
  const client = await supabaseServer();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (["invalid_credentials", "email_not_confirmed"].includes(error.code ?? "")) return undefined;
    throw error;
  }
  if (!data.user) return undefined;
  const account = await accountFor(client, data.user.id);
  if (!account) await client.auth.signOut({ scope: "local" });
  return account;
}

export async function endSession() {
  const { error } = await (await supabaseServer()).auth.signOut({ scope: "local" });
  if (error) throw error;
}
