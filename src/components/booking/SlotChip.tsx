interface SlotChipProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
}

export function SlotChip({ label, selected, onClick }: SlotChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-sm border px-3 py-2 font-mono text-sm transition-colors ${
        selected
          ? "border-brass bg-brass text-ink"
          : "border-charcoal bg-ink-raised/40 text-cream hover:border-smoke"
      }`}
    >
      {label}
    </button>
  );
}
