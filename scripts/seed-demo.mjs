import { createClient } from "@supabase/supabase-js";
import { demoAccounts, demoPassword } from "../lib/demo-accounts.ts";

const expectedRef = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!/^[a-z]{20}$/.test(expectedRef ?? "") || new URL(url ?? "http://invalid").origin !== "https://" + expectedRef + ".supabase.co") {
  throw new Error("Pass the expected project ref and set its URL in .env.local.");
}
if (!secret) throw new Error("Set SUPABASE_SECRET_KEY in the current terminal before seeding.");

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const { data: profiles, error: profilesError } = await supabase.from("transekur_accounts").select("id, user_id");
if (profilesError) throw profilesError;

const byEmail = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  for (const user of data.users) byEmail.set(user.email?.toLowerCase(), user);
  if (data.users.length < 100) break;
}

for (const account of demoAccounts) {
  let user = byEmail.get(account.email);
  const existingProfile = profiles.find((profile) => profile.id === account.id);
  if (user && user.app_metadata.transekur_demo !== account.id && existingProfile?.user_id !== user.id) {
    throw new Error("The demo email is already in use without the corresponding Transekur profile: " + account.email);
  }
  if (existingProfile && existingProfile.user_id !== user?.id) {
    throw new Error("The Transekur profile is already assigned to a different user: " + account.id);
  }
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: demoPassword,
      email_confirm: true,
      app_metadata: { transekur_demo: account.id },
    });
    if (error) throw error;
    user = data.user;
  }
  if (!user) throw new Error("Supabase did not return the new demo user.");

  const { error } = await supabase.from("transekur_accounts").upsert({
    id: account.id,
    user_id: user.id,
    role: account.role,
    name: account.name,
    vehicle: account.role === "driver" ? account.vehicle : null,
    vehicle_es: account.role === "driver" ? account.vehicleEs : null,
    plate: account.role === "driver" ? account.plate : null,
  });
  if (error) throw error;
}

console.log("Transekur demo accounts are ready.");
