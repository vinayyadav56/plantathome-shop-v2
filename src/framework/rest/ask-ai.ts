import { useCallback, useState } from 'react';
import { useQuery } from 'react-query';
import { useRouter } from '@/compat/next-router';
import { HttpClient } from '@/framework/client/http-client';
import { useUser } from '@/framework/user';
import type { Product } from '@/types';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AskResponse {
  reply: string;
  conversation_id: string;
  prompt_count: number;
  limit_reached: boolean;
}

/** Storefront feature flag + cap — is Ask AI switched on in admin? */
export function useAskAiEnabled() {
  return useQuery(
    ['ai-chat-enabled'],
    () =>
      HttpClient.get<{ data: { enabled: boolean; max_prompts: number } }>(
        'ai-chat/settings',
      ),
    { staleTime: 60_000 },
  );
}

/** Build the compact plant context the model is scoped to. */
function plantContext(product: Product) {
  const pa: any = (product as any)?.plant_attribute ?? {};
  const facts = [
    pa.sunlight && `Sunlight: ${pa.sunlight}`,
    pa.water_requirement && `Water: ${pa.water_requirement}`,
    pa.height_range && `Height: ${pa.height_range}`,
    (pa.pet_friendly ?? (product as any)?.pet_friendly) && 'Pet-friendly',
    (pa.origin ?? (product as any)?.origin) && `Origin: ${pa.origin ?? (product as any)?.origin}`,
    product.description && String(product.description).replace(/<[^>]+>/g, ' ').slice(0, 400),
  ]
    .filter(Boolean)
    .join('. ');
  return {
    id: product.id,
    name: product.name,
    scientific_name: pa.scientific_name ?? pa.botanical_name ?? null,
    facts: facts || null,
  };
}

/**
 * Per-plant chat state. Sends through the same-origin /api/ask-ai proxy (which
 * injects the service key); persistence + the hard cap are enforced server-side.
 */
export function useAskAi(product: Product, maxPrompts = 10) {
  const { me } = useUser();
  const { locale } = useRouter();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || sending || limitReached) return;
      setError(null);
      setSending(true);
      setMessages((m) => [...m, { role: 'user', content: text }]);
      try {
        const res = await fetch('/api/ask-ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: me?.id,
            conversation_id: conversationId,
            plant: plantContext(product),
            message: text,
            language: locale || 'en',
          }),
        });
        const data: AskResponse = await res.json();
        if (!res.ok || !data?.reply) throw new Error('failed');
        setConversationId(data.conversation_id);
        setPromptCount(data.prompt_count ?? 0);
        setLimitReached(Boolean(data.limit_reached));
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      } catch {
        setError('Could not reach the assistant. Please try again.');
        // drop the optimistic user bubble that didn't get an answer
        setMessages((m) => (m[m.length - 1]?.role === 'user' ? m.slice(0, -1) : m));
      } finally {
        setSending(false);
      }
    },
    [me?.id, conversationId, product, locale, sending, limitReached],
  );

  /** Flush the transcript to the DB exactly once when the chat closes. */
  const end = useCallback(() => {
    if (!conversationId) return;
    const body = JSON.stringify({ conversation_id: conversationId });
    // keepalive so the request survives the modal/page unmount.
    try {
      fetch('/api/ask-ai/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    } catch {
      /* best-effort; the service idle-sweep will flush it anyway */
    }
  }, [conversationId]);

  return {
    messages,
    promptCount,
    maxPrompts,
    limitReached,
    sending,
    error,
    send,
    end,
  };
}
