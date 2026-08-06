"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="font-mono text-xs text-smoke uppercase tracking-widest hover:text-cream"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/staff/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
