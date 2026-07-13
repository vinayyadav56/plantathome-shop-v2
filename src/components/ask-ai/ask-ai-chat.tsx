import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useModalState, useModalAction } from '@/components/ui/modal/modal.context';
import { useAskAi, useAskAiEnabled } from '@/framework/ask-ai';
import type { Product } from '@/types';

const Sparkle = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zM5 15l.9 2.6L8.5 18.5 5.9 19.4 5 22l-.9-2.6L1.5 18.5l2.6-.9L5 15z" />
  </svg>
);

export default function AskAiChat() {
  const { data } = useModalState();
  const { closeModal } = useModalAction();
  const product: Product | undefined = data?.product;
  const { data: settings } = useAskAiEnabled();
  const maxPrompts = settings?.data?.max_prompts ?? 10;

  const {
    messages,
    promptCount,
    limitReached,
    sending,
    error,
    send,
    end,
  } = useAskAi(product as Product, maxPrompts);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist the transcript exactly once when the popup unmounts (close/escape/backdrop).
  useEffect(() => () => end(), [end]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  if (!product) return null;

  const image = product.image?.thumbnail ?? product.image?.original ?? '';
  const remaining = Math.max(0, maxPrompts - promptCount);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || limitReached) return;
    send(input);
    setInput('');
  }

  return (
    <div className="flex h-[80vh] max-h-[680px] w-[440px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl bg-white sm:h-[640px]">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-stone-100 bg-gradient-to-r from-[#F4F7F1] to-white px-5 py-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#E7EEE2]">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" sizes="44px" />
          ) : (
            <span className="grid h-full w-full place-items-center text-forest-700">🌿</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-600">
            <Sparkle className="h-3.5 w-3.5" /> Ask AI
          </div>
          <h3 className="truncate text-[15px] font-semibold text-forest-900">{product.name}</h3>
        </div>
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FBFBF9] px-4 py-4">
        {messages.length === 0 && (
          <div className="mx-auto mt-6 max-w-sm text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#E7EEE2] text-forest-700">
              <Sparkle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-forest-900">
              Ask me anything about {product.name}
            </p>
            <p className="mt-1 text-[12.5px] text-stone-500">
              Care, watering, light, pets, troubleshooting — in any language. {maxPrompts} questions per chat.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['How often should I water it?', 'Is it pet-safe?', 'Why are the leaves yellow?'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setInput(''); send(q); }}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12px] text-stone-600 transition hover:border-forest-300 hover:text-forest-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-forest-600 text-white'
                  : 'rounded-bl-md border border-stone-100 bg-white text-stone-700 shadow-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-stone-100 bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-forest-400"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-[12px] text-red-500">{error}</p>
        )}
      </div>

      {/* composer */}
      <div className="border-t border-stone-100 bg-white px-4 py-3">
        {!limitReached && (
          <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] text-stone-400">
            <span>Scoped to {product.name}</span>
            <span className={remaining <= 2 ? 'font-semibold text-[#B4501E]' : ''}>
              {promptCount}/{maxPrompts}
            </span>
          </div>
        )}
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) onSubmit(e);
            }}
            rows={1}
            disabled={limitReached || sending}
            placeholder={limitReached ? 'Question limit reached' : 'Type your question…'}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-stone-200 bg-[#FBFBF9] px-4 py-3 text-[13.5px] text-stone-800 outline-none transition focus:border-forest-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={limitReached || sending || !input.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ds-btn text-white transition hover:bg-ds-btn-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
