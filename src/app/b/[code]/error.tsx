'use client';

export default function BlogError({ reset }: { reset: () => void }) {
  return <main className="max-w-xl mx-auto px-6 py-20">
    <h1 className="text-2xl font-semibold">This blog could not be loaded</h1>
    <p className="mt-3 text-neutral-500">Storage may be unavailable or sharing may still need to be configured.</p>
    <button onClick={reset} className="mt-5 underline cursor-pointer">Try again</button>
  </main>;
}
