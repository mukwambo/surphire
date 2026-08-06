interface SelectableCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  selected?: boolean;
  onClick: () => void;
}

export function SelectableCard({ title, subtitle, meta, selected, onClick }: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-sm border px-4 py-4 text-left transition-colors ${
        selected
          ? "border-brass bg-ink-raised"
          : "border-charcoal bg-ink-raised/40 hover:border-smoke"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold uppercase tracking-wide text-cream">
            {title}
          </div>
          {subtitle && <div className="mt-0.5 text-sm text-smoke">{subtitle}</div>}
        </div>
        {meta && <div className="font-mono text-sm whitespace-nowrap text-brass">{meta}</div>}
      </div>
    </button>
  );
}
