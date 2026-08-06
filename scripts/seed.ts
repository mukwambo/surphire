/**
 * One-off setup script for tonight's demo/pilot shop. Mirrors the doc's
 * "Setup Flow": owner account -> shop -> barbers -> services -> hours.
 * Run with: npx tsx scripts/seed.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import qrcode from "qrcode";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@fadeandco.test";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "barberbook-demo-1";
const SHOP_SLUG = "fade-and-co";

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Creating owner account…");
  const { data: userResult, error: userError } = await supabase.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
  });
  if (userError) throw userError;
  const ownerId = userResult.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: ownerId,
    name: "Fade & Co Owner",
    email: OWNER_EMAIL,
    role: "owner",
  });
  if (profileError) throw profileError;

  console.log("Creating shop…");
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .insert({
      owner_id: ownerId,
      name: "Fade & Co",
      slug: SHOP_SLUG,
      phone: "+254700000000",
      location: "Nairobi",
      timezone: "Africa/Nairobi",
      status: "active",
    })
    .select()
    .single();
  if (shopError) throw shopError;

  console.log("Adding barbers…");
  const { data: barbers, error: barberError } = await supabase
    .from("barbers")
    .insert([
      { shop_id: shop.id, display_name: "Sam" },
      { shop_id: shop.id, display_name: "Kevo" },
    ])
    .select();
  if (barberError) throw barberError;

  console.log("Adding services…");
  const { error: serviceError } = await supabase.from("services").insert([
    { shop_id: shop.id, name: "Skin fade", description: "Clean fade with line-up", price: 500, duration_minutes: 30 },
    { shop_id: shop.id, name: "Haircut & beard", description: "Full service", price: 800, duration_minutes: 45 },
    { shop_id: shop.id, name: "Beard trim", description: null, price: 300, duration_minutes: 15 },
  ]);
  if (serviceError) throw serviceError;

  console.log("Setting working hours (Mon-Sat, 9am-7pm)…");
  const workingHourRows = barbers.flatMap((barber) =>
    [1, 2, 3, 4, 5, 6].map((day) => ({
      barber_id: barber.id,
      day_of_week: day,
      open_time: "09:00:00",
      close_time: "19:00:00",
    })),
  );
  const { error: hoursError } = await supabase.from("working_hours").insert(workingHourRows);
  if (hoursError) throw hoursError;

  const bookingUrl = `${SITE_URL}/${SHOP_SLUG}`;
  const qrPath = "scripts/fade-and-co-qr.png";
  await qrcode.toFile(qrPath, bookingUrl, { width: 512 });

  console.log("\nDone.\n");
  console.log("Owner login:");
  console.log(`  email:    ${OWNER_EMAIL}`);
  console.log(`  password: ${OWNER_PASSWORD}`);
  console.log(`\nBooking link: ${bookingUrl}`);
  console.log(`QR code saved to: ${qrPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
