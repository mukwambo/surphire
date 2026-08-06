import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-pole-red text-cream hover:bg-pole-red/90 disabled:bg-charcoal disabled:text-smoke",
  secondary: "bg-ink-raised text-cream border border-charcoal hover:border-brass",
  danger: "bg-transparent text-pole-red border border-pole-red hover:bg-pole-red/10",
  ghost: "bg-transparent text-smoke hover:text-cream",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
