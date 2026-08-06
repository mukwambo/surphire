import Link from "next/link";
import { SignOutButton } from "@/components/staff/SignOutButton";

const NAV = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/services", label: "Services" },
  { href: "/staff/barbers", label: "Barbers" },
  { href: "/staff/hours", label: "Hours" },
  { href: "/staff/blocked-times", label: "Blocked time" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-charcoal px-4 py-3">
        <nav className="flex flex-wrap gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-xs text-smoke uppercase tracking-widest hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </header>
      <div className="flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
