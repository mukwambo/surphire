"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createBlockedTime } from "@/app/staff/blocked-times/actions";

export function AddBlockedTimeForm({ barberId, timezone }: { barberId: string; timezone: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createBlockedTime(barberId, timezone, formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-3 rounded-sm border border-dashed border-charcoal px-4 py-4"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-brass">Block time</p>
      <div className="flex flex-wrap gap-3">
        <Field label={`Starts (${timezone})`}>
          <TextInput name="starts_at" type="datetime-local" required />
        </Field>
        <Field label={`Ends (${timezone})`}>
          <TextInput name="ends_at" type="datetime-local" required />
        </Field>
      </div>
      <Field label="Reason">
        <TextInput name="reason" placeholder="Lunch, holiday, etc." />
      </Field>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Blocking…" : "Block time"}
      </Button>
    </form>
  );
}
