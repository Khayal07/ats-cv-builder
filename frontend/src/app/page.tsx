import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-desk">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{siteConfig.name}</h1>
        <p className="max-w-xl text-lg text-ink-soft">{siteConfig.description}</p>
        <Link
          href="/builder"
          className="self-start rounded-md bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)]"
        >
          Start your resume
        </Link>
      </div>
    </main>
  );
}
