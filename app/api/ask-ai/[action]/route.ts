import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin proxy for the per-plant "Ask AI" chat.
 *
 * App Router port of V1's `pages/api/ask-ai/[action].ts`, which was LOST in the
 * V1 to V2 storefront port: `framework/rest/ask-ai.ts` still POSTs to
 * `/api/ask-ai/ask` and `/api/ask-ai/end`, but no such route existed here, so
 * both answered 404 on every deployment. The Ask AI pill is wired correctly on
 * the product page and on product cards; the chat behind it simply had nowhere
 * to go.
 *
 * The browser talks to this Node route rather than the service directly so the
 * microservice's X-Api-Key never reaches the client. It forwards /ask and /end
 * to the async FastAPI chatbot service, which owns the live conversation state,
 * the per-chat prompt cap and the one-shot DB persist. Deliberately NOT a
 * rewrite in next.config: a rewrite cannot inject a server-only secret.
 *
 * Env (server-only, must be set on the deployment):
 *   CHATBOT_SERVICE_URL      e.g. https://chatbot-service-production-xxxx.up.railway.app
 *   CHATBOT_SERVICE_API_KEY  shared secret, sent as X-Api-Key
 *
 * Without CHATBOT_SERVICE_URL this answers 503 rather than pretending to work,
 * which is the same fail-closed behaviour V1 shipped.
 */

// Node, not edge: reads server-only env and forwards an arbitrary JSON body.
export const runtime = 'nodejs';
// Never cache a chat turn.
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['ask', 'end']);

/** Upstream can be slow on a cold start; well under a serverless ceiling. */
const TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (!ALLOWED.has(action)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const base = process.env.CHATBOT_SERVICE_URL;
  if (!base) {
    return NextResponse.json(
      { message: 'Ask AI is not configured.' },
      { status: 503 },
    );
  }

  // Read as text so an oversized or malformed body is rejected here rather
  // than forwarded upstream.
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CHATBOT_SERVICE_API_KEY
          ? { 'X-Api-Key': process.env.CHATBOT_SERVICE_API_KEY }
          : {}),
      },
      body: body || '{}',
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text || '{}', {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Includes the abort. The caller shows "Could not reach the assistant".
    return NextResponse.json(
      { message: 'Ask AI service is unavailable.' },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Anything but POST, so a stray GET gets a clear answer instead of a 404. */
export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
