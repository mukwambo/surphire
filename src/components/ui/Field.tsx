import { InputHTMLAttributes, ReactNode } from "react";

const inputClasses =
  "rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}
