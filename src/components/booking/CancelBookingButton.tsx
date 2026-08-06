"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { apiFetch } from "@/lib/booking/client-types";

export function CancelBookingButton({ reference }: { reference: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Cancel booking
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error && <ErrorState label={error} />}
      <p className="text-sm text-smoke">Cancel this booking? This can&apos;t be undone.</p>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>
          Keep it
        </Button>
        <Button
          variant="danger"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await apiFetch(`/api/bookings/${reference}/cancel`, { method: "POST" });
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
              setLoading(false);
            }
          }}
        >
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Button>
      </div>
    </div>
  );
}
