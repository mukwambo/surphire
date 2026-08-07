"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/staff/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-brass uppercase">
          Surphire
        </p>
        <h1 className="mt-1 mb-6 text-center font-display text-2xl font-bold uppercase text-cream">
          Staff login
        </h1>
        {error && <div className="mb-4"><ErrorState label={error} /></div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass"
            />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
