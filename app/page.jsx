import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="relative flex min-h-[80svh] items-center justify-center text-center">
      <div>
        <p className="mb-2 text-2xl text-[#d4a373]">Welcome to</p>
        <h1 className="font-dancing text-[clamp(48px,8vw,88px)] leading-none text-[#0f172a]">
          Sisi Kopi
        </h1>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-6 text-sm text-black/70">
        <p>Choose your menu</p>
        <p>Slide in now!</p>
      </div>

      <Link
        href="/menu"
        aria-label="Buka menu"
        className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#d4a373] text-white shadow-lg transition active:scale-95 hover:shadow-xl"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </section>
  );
}
