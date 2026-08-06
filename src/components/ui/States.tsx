export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <p className="py-8 text-center font-mono text-sm text-smoke">{label}</p>;
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-dashed border-charcoal px-4 py-8 text-center font-mono text-sm text-smoke">
      {label}
    </div>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-pole-red/50 bg-pole-red/10 px-4 py-3 text-sm text-pole-red">
      {label}
    </div>
  );
}
