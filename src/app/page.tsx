import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase">BarberBook</p>
      <h1 className="max-w-md font-display text-4xl font-bold uppercase text-cream">
        Every shop gets its own link.
      </h1>
      <p className="max-w-sm text-smoke">
        Customers book from a shop&apos;s own page or QR code — there&apos;s nothing to browse here.
      </p>
      <Link href="/staff/login" className="font-mono text-sm text-pole-blue underline">
        Staff login →
      </Link>
    </main>
  );
}
