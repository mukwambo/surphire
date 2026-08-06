export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
}

export interface BarberDTO {
  id: string;
  displayName: string;
}

export interface SlotDTO {
  startsAt: string;
  endsAt: string;
  barberId: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message ?? "Something went wrong. Please try again.");
  }
  return json.data as T;
}
