import Link from "next/link";

// Rendered by Next.js for any URL with no matching `page.tsx`
// (e.g. `/`, `/dashboard`, `/finance`, `/purchase`, typos).
// Without this file Next shows a bare generic 404.
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-4 bg-[#F7F4EC] px-6 text-center">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C1652B]">
        404 · Page not found
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-[#14201C]">
        This ledger page doesn&apos;t exist
      </h1>
      <p className="max-w-sm text-[13.5px] leading-relaxed text-[#14201C]/55">
        The URL you opened has no matching page. Head back to your dashboard or
        sign in to continue.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/purchase-dashboard"
          className="bg-[#14201C] px-5 py-2.5 text-[13px] font-semibold text-[#F7F4EC] transition-colors hover:bg-[#0E3B36]"
        >
          Go to dashboard
        </Link>
        <Link
          href="/sign-in"
          className="border border-[#DED7C4] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#14201C]/70 transition-colors hover:bg-[#EFEADC]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
