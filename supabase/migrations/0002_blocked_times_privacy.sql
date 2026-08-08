-- blocked_times.reason is staff-only free text (e.g. "dentist appointment")
-- but "blocked_times_public_select" granted unrestricted row access with no
-- column limits, so it was readable by anyone with the anon key via direct
-- REST calls, independent of what the app's own routes select.
--
-- Drop public access to the base table; expose a view with only the columns
-- the public booking flow needs.

drop policy "blocked_times_public_select" on blocked_times;

create view blocked_windows_public
with (security_invoker = false) as
  select barber_id, starts_at, ends_at from blocked_times;

grant select on blocked_windows_public to anon, authenticated;
