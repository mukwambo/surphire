/**
 * Onboard a new barbershop. Mirrors the doc's "Setup Flow": owner account ->
 * shop -> barbers -> services -> hours -> QR code. This is the "set it up
 * for them personally" step from the pilot playbook -- run once per shop.
 *
 * Usage:
 *   npm run onboard -- \
 *     --name "Fresh Cuts" \
 *     --slug fresh-cuts \
 *     --owner-email owner@freshcuts.test \
 *     --barbers "Sam,Kevo" \
 *     --services "Skin fade:500:30,Haircut & beard:800:45,Beard trim:300:15"
 *
 * Run with no arguments (or --help) to see the full list of options.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import qrcode from "qrcode";
import { randomBytes } from "node:crypto";

const HELP = `
Onboard a new barbershop onto BarberBook.

Required:
  --name <text>              Shop display name, e.g. "Fresh Cuts"
  --slug <text>               URL slug, e.g. "fresh-cuts" (becomes /fresh-cuts)
  --owner-email <email>        Owner's login email
  --barbers <list>             Comma-separated barber names, e.g. "Sam,Kevo"
  --services <list>            Comma-separated "Name:Price:DurationMinutes",
                               e.g. "Skin fade:500:30,Beard trim:300:15"

Optional:
  --owner-name <text>          Defaults to "<name> Owner"
  --owner-password <text>      Defaults to a random generated password
  --phone <text>
  --location <text>
  --timezone <IANA tz>          Defaults to "Africa/Nairobi"
  --days <list>                 Comma-separated day-of-week numbers worked
                                (0=Sun..6=Sat), defaults to "1,2,3,4,5,6"
  --open <HH:MM>                Opening time, defaults to "09:00"
  --close <HH:MM>               Closing time, defaults to "19:00"
  --site-url <url>              Defaults to $NEXT_PUBLIC_SITE_URL or localhost
`;

function fail(message: string): never {
  console.error(`\nError: ${message}\n${HELP}`);
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    help: { type: "boolean", default: false },
    name: { type: "string" },
    slug: { type: "string" },
    "owner-email": { type: "string" },
    "owner-name": { type: "string" },
    "owner-password": { type: "string" },
    barbers: { type: "string" },
    services: { type: "string" },
    phone: { type: "string" },
    location: { type: "string" },
    timezone: { type: "string", default: "Africa/Nairobi" },
    days: { type: "string", default: "1,2,3,4,5,6" },
    open: { type: "string", default: "09:00" },
    close: { type: "string", default: "19:00" },
    "site-url": { type: "string" },
  },
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const { name, slug, barbers: barbersArg, services: servicesArg } = values;
const ownerEmail = values["owner-email"];
if (!name || !slug || !ownerEmail || !barbersArg || !servicesArg) {
  fail("--name, --slug, --owner-email, --barbers, and --services are all required.");
}

const barberNames = barbersArg
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (barberNames.length === 0) fail("--barbers must list at least one name.");

const serviceRows = servicesArg.split(",").map((entry) => {
  const [svcName, price, duration] = entry.split(":").map((s) => s.trim());
  if (!svcName || !price || !duration || Number.isNaN(Number(price)) || Number.isNaN(Number(duration))) {
    fail(`Invalid --services entry "${entry}". Expected "Name:Price:DurationMinutes".`);
  }
  return { name: svcName, price: Number(price), duration_minutes: Number(duration) };
});

const workingDays = values.days.split(",").map((d) => {
  const n = Number(d.trim());
  if (Number.isNaN(n) || n < 0 || n > 6) fail(`Invalid day "${d}" in --days (expected 0-6).`);
  return n;
});

const ownerName = values["owner-name"] ?? `${name} Owner`;
const ownerPassword = values["owner-password"] ?? randomBytes(9).toString("base64url");
const siteUrl = values["site-url"] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Creating owner account for ${ownerEmail}…`);
  const { data: userResult, error: userError } = await supabase.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
  });
  if (userError) fail(`Could not create owner account: ${userError.message}`);
  const ownerId = userResult.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: ownerId,
    name: ownerName,
    email: ownerEmail,
    role: "owner",
  });
  if (profileError) fail(`Could not create profile: ${profileError.message}`);

  console.log(`Creating shop "${name}" (/${slug})…`);
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .insert({
      owner_id: ownerId,
      name,
      slug,
      phone: values.phone ?? null,
      location: values.location ?? null,
      timezone: values.timezone,
      status: "active",
    })
    .select()
    .single();
  if (shopError) fail(`Could not create shop (is the slug already taken?): ${shopError.message}`);

  console.log(`Adding ${barberNames.length} barber(s)…`);
  const { data: barbers, error: barberError } = await supabase
    .from("barbers")
    .insert(barberNames.map((display_name) => ({ shop_id: shop.id, display_name })))
    .select();
  if (barberError) fail(`Could not create barbers: ${barberError.message}`);

  console.log(`Adding ${serviceRows.length} service(s)…`);
  const { error: serviceError } = await supabase
    .from("services")
    .insert(serviceRows.map((s) => ({ ...s, shop_id: shop.id })));
  if (serviceError) fail(`Could not create services: ${serviceError.message}`);

  console.log(`Setting working hours (${values.open}-${values.close} on days [${workingDays.join(", ")}])…`);
  const workingHourRows = barbers.flatMap((barber) =>
    workingDays.map((day) => ({
      barber_id: barber.id,
      day_of_week: day,
      open_time: `${values.open}:00`,
      close_time: `${values.close}:00`,
    })),
  );
  const { error: hoursError } = await supabase.from("working_hours").insert(workingHourRows);
  if (hoursError) fail(`Could not set working hours: ${hoursError.message}`);

  const bookingUrl = `${siteUrl}/${slug}`;
  const qrPath = `scripts/qr/${slug}.png`;
  await qrcode.toFile(qrPath, bookingUrl, { width: 512 });

  console.log("\nDone.\n");
  console.log("Owner login:");
  console.log(`  email:    ${ownerEmail}`);
  console.log(`  password: ${ownerPassword}`);
  console.log(`\nBooking link: ${bookingUrl}`);
  console.log(`QR code saved to: ${qrPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
