"use client";

import { useRef, useTransition } from "react";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createBarber } from "@/app/staff/(protected)/barbers/actions";

export function AddBarberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createBarber(formData);
          formRef.current?.reset();
        })
      }
      className="flex items-end gap-3 rounded-sm border border-dashed border-charcoal px-4 py-4"
    >
      <Field label="Barber name">
        <TextInput name="display_name" placeholder="Sam" required />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add barber"}
      </Button>
    </form>
  );
}
