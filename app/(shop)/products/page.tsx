'use client';

import { useState } from 'react';
import { ProductGrid } from '@/components/products/ProductGrid';

export default function ProductsPage() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div className="container-wrap py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-forest-ink">Shop plants</h1>
          <p className="text-forest-ink/60">Browse the collection, then pick your city to check delivery.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(input.trim());
          }}
          className="flex w-full max-w-sm gap-2"
        >
          <input
            className="field"
            type="search"
            placeholder="Search plants…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search plants"
          />
          <button type="submit" className="btn-outline shrink-0">
            Search
          </button>
        </form>
      </div>

      <ProductGrid search={search || undefined} limit={48} />
    </div>
  );
}
