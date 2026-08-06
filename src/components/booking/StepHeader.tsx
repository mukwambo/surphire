interface StepHeaderProps {
  step: number;
  total: number;
  title: string;
}

export function StepHeader({ step, total, title }: StepHeaderProps) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-mono text-sm text-brass">
        {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-cream">
        {title}
      </h2>
    </div>
  );
}
