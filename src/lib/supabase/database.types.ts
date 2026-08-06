// Hand-written types matching supabase/migrations/0001_init.sql.
// Swap for `supabase gen types typescript` output once the project is linked.

export type UserRole = "owner" | "barber";
export type ShopStatus = "active" | "inactive";
export type ServiceStatus = "active" | "inactive";
export type BarberStatus = "active" | "inactive";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  location: string | null;
  timezone: string;
  status: ShopStatus;
  created_at: string;
}

export interface Barber {
  id: string;
  shop_id: string;
  user_id: string | null;
  display_name: string;
  status: BarberStatus;
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  status: ServiceStatus;
  created_at: string;
}

export interface WorkingHour {
  id: string;
  barber_id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  open_time: string; // "HH:MM:SS"
  close_time: string;
}

export interface BlockedTime {
  id: string;
  barber_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  reference: string;
  shop_id: string;
  customer_id: string;
  barber_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
}
