"use client";

import { useState, useTransition } from "react";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toggleServiceStatus, updateService } from "@/app/staff/services/actions";
import type { Service } from "@/lib/supabase/database.types";

export function ServiceRow({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-3">
        <div>
          <div className="font-display text-lg font-semibold uppercase text-cream">
            {service.name}
          </div>
          <div className="font-mono text-sm text-smoke">
            KES {service.price} · {service.duration_minutes} min
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            variant={service.status === "active" ? "danger" : "primary"}
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                toggleServiceStatus(service.id, service.status === "active" ? "inactive" : "active"),
              )
            }
          >
            {service.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await updateService(service.id, formData);
          setEditing(false);
        })
      }
      className="flex flex-col gap-3 rounded-sm border border-brass bg-ink-raised px-4 py-4"
    >
      <Field label="Name">
        <TextInput name="name" defaultValue={service.name} required />
      </Field>
      <Field label="Description">
        <TextInput name="description" defaultValue={service.description ?? ""} />
      </Field>
      <div className="flex gap-3">
        <Field label="Price (KES)">
          <TextInput name="price" type="number" step="0.01" defaultValue={service.price} required />
        </Field>
        <Field label="Duration (min)">
          <TextInput
            name="duration_minutes"
            type="number"
            defaultValue={service.duration_minutes}
            required
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
