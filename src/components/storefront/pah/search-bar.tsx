'use client';
import React from 'react';
import { useRouter } from '@/compat/next-router';

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  return (
    <div className="relative z-[5] -mt-[28px] mb-[22px] px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = q.trim();
          router.push(t ? `/search?text=${encodeURIComponent(t)}` : '/plants/search');
        }}
        className="flex items-center gap-2 rounded-2xl border border-kraft-200 bg-white py-1.5 pl-4 pr-1.5 shadow-[0_9px_22px_rgba(15,30,18,0.22)]"
      >
        <i className="fa-solid fa-magnifying-glass text-[16px] text-stone-500" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for plants, pots…"
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent py-2 font-hanken text-[14px] text-forest-900 outline-none placeholder:text-stone-500"
        />
        <button
          type="submit"
          className="rounded-[11px] bg-ds-btn px-[15px] py-[9px] font-hanken text-[14px] font-semibold text-white transition-[background,transform] duration-200 hover:bg-ds-btn-hover active:scale-95 active:bg-forest-800"
        >
          Search
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
