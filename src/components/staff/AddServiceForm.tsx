"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createService } from "@/app/staff/services/actions";

export function AddServiceForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createService(formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-3 rounded-sm border border-dashed border-charcoal px-4 py-4"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-brass">Add a service</p>
      <Field label="Name">
        <TextInput name="name" placeholder="Skin fade" required />
      </Field>
      <Field label="Description">
        <TextInput name="description" placeholder="Optional" />
      </Field>
      <div className="flex gap-3">
        <Field label="Price (KES)">
          <TextInput name="price" type="number" step="0.01" defaultValue={0} required />
        </Field>
        <Field label="Duration (min)">
          <TextInput name="duration_minutes" type="number" defaultValue={30} required />
        </Field>
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Adding…" : "Add service"}
      </Button>
    </form>
  );
}
