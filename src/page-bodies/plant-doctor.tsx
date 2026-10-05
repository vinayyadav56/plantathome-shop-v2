'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import { Routes } from '@/config/routes';
import { useUser } from '@/framework/user';
import {
  useDiagnose,
  usePlantDoctorEnabled,
  usePlantDoctorHistory,
  useSaveConsultation,
  useDeleteConsultation,
  ConsultationRecord,
  DiagnoseInput,
  DiagnosisResponse,
  Severity,
} from '@/framework/plant-doctor';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Checks,
  ChevronDown,
  CircleAlert,
  Flower2,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
} from '@/components/ui/icon';

/* ────────────────────────────────────────────────────────────────────────────
   Plant Doctor as a chat (owner annotation 2026-10-05: "this whole page should
   be like whatsapp chat and upper section should take less space").

   The 620px hero + three step cards + two-column form became a ~56px chat bar,
   a thread and a composer. The diagnosis API is unchanged and still ONE-SHOT —
   there is no server-side conversation — so a "chat" here is a sequence of
   check-ups: a follow-up message re-sends the same photo with everything the
   shopper has said so far and comes back as an "Updated diagnosis".

   Layout, deliberately two different shapes:
     < md   page flow. The site footer and the fixed bottom nav mean the root
            always scrolls on a phone, so an app-shell window would nest two
            scrollers and strand the layout when the keyboard opens. Instead the
            thread is ordinary page content; the chat bar sticks under the site
            header and the composer sticks to the bottom, padded clear of the
            bottom nav.
     md+    a fixed-height window (WhatsApp Web): the thread scrolls inside it
            and, from lg, past check-ups sit in a pane on the left.
   ──────────────────────────────────────────────────────────────────────────── */

const SEVERITY_STYLE: Record<Severity, { label: string; cls: string; bar: string }> = {
  low:      { label: 'Low',      cls: 'bg-[#F3F8EC] text-[#24693E] border-[#DCE8D3]', bar: '#2E5E2A' },
  medium:   { label: 'Medium',   cls: 'bg-[#FBF1DD] text-[#8A6A23] border-[#E8D4A8]', bar: '#B58E39' },
  high:     { label: 'High',     cls: 'bg-[#FBE7DA] text-[#9A4F1E] border-[#E6C3A3]', bar: '#C07035' },
  critical: { label: 'Critical', cls: 'bg-[#FBE2DE] text-[#A23022] border-[#E9B7AE]', bar: '#C0492B' },
};

const SEV_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/* Chat surfaces. Incoming = white, outgoing = WhatsApp's light green; both on
   the warm paper wallpaper. No bubble "tails": every radius on this site
   resolves to the one --radius-box token, so a squared-off corner can't be
   expressed without breaking the canon. */
const BUBBLE = 'break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-[0_1px_1px_rgba(11,20,26,0.07)]';
const BOT = `${BUBBLE} w-fit max-w-[92%] border border-kraft-200 bg-white text-[#184A31] sm:max-w-[78%]`;
/** A bot bubble that holds structured content (report sections), so it takes a fixed measure. */
const BOT_WIDE = `${BUBBLE} w-full max-w-[560px] border border-kraft-200 bg-white text-[#184A31]`;
const USER = `${BUBBLE} w-fit max-w-[88%] bg-[#D9FDD3] text-[#111B21] sm:max-w-[70%]`;
const ITEM = 'flex scroll-my-3 flex-col gap-1.5';
/** Below md the chat bar is sticky under the 58px site header (see <header>). */
const PHONE_BARS = 58 + 56;
const ICON_BTN =
  'grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#54656F] transition hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24693E]/40 disabled:cursor-not-allowed disabled:opacity-40';
const QUICK_BTN =
  'inline-flex items-center gap-1.5 rounded-full border border-[#24693E]/30 bg-[#F3F8EC] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#24693E] transition hover:border-ds-btn hover:bg-ds-btn hover:text-white';

const WALLPAPER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='132' height='132' viewBox='0 0 132 132' fill='none' stroke='%23DDD6C8' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 34c8-11 21-11 28 0-8 9-20 9-28 0Zm0 0h28'/%3E%3Cpath d='M92 18v14m-7-7h14'/%3E%3Ccircle cx='104' cy='84' r='5.5'/%3E%3Cpath d='M30 104c0-11 8-18 18-18 0 11-7 18-18 18Zm0 0 13-13'/%3E%3Cpath d='M70 60c5-7 13-7 18 0'/%3E%3Cpath d='M64 112h12'/%3E%3C/svg%3E")`;

/* ────────────────────────────────────────────────────────────────────────────
   Image helpers
   ──────────────────────────────────────────────────────────────────────────── */

function fileToScaledBase64(file: File, max = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1] ?? '');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Tiny thumbnail for the check-ups list — keeps localStorage well under quota. */
function makeThumb(dataUrl: string, max = 160, quality = 0.62): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('decode failed'));
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   Check-up history — signed-in users read/write the server
   (plant-doctor/consultations); localStorage is the signed-out store.
   Everything renders strictly after mount (hydration-safe).
   ──────────────────────────────────────────────────────────────────────────── */

const HISTORY_KEY = 'pah-plant-doctor-history';
const HISTORY_MAX = 12;

interface ConsultationEntry {
  id: string;
  at: string; // ISO date
  title: string;
  thumb?: string;
  score: number;
  severity: Severity;
  conditions: string[];
  result: DiagnosisResponse;
}

function readHistory(): ConsultationEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e && e.id && e.result) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: ConsultationEntry[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // quota / private mode — history is a nicety, never block the diagnosis
  }
}

function worstSeverity(data: DiagnosisResponse): Severity {
  return (data.diagnosis ?? []).reduce<Severity>(
    (acc, d) => ((SEV_RANK[d.severity] ?? 0) > SEV_RANK[acc] ? d.severity : acc),
    'low',
  );
}

/** Map a server-side consultation row onto the shape the list renders. */
function entryFromServer(row: ConsultationRecord): ConsultationEntry {
  const d = row.diagnosis ?? ({} as DiagnosisResponse);
  return {
    id: String(row.id),
    at: row.created_at,
    title:
      d.identification?.common_name || d.plant_name || row.plant_name || 'Plant check-up',
    thumb: row.thumb ?? undefined,
    score:
      typeof d.overall_health_score === 'number'
        ? d.overall_health_score
        : row.health_score != null
          ? row.health_score / 100
          : 0,
    severity:
      row.worst_severity && row.worst_severity in SEV_RANK
        ? row.worst_severity
        : worstSeverity(d),
    conditions: (d.diagnosis ?? []).map((x) => x.condition).slice(0, 3),
    result: d,
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Only ever called for messages created in a click handler — never during SSR. */
function formatTime(at: number) {
  try {
    return new Date(at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ────────────────────────────────────────────────────────────────────────────
   Conversation model
   ──────────────────────────────────────────────────────────────────────────── */

type Photo = { b64: string; url: string };

/** One plant under discussion. A new photo starts a new Case; a text-only
 *  follow-up continues the current one (same photo, more to go on). */
interface Case {
  id: string; // sent as session_id — log correlation only, the API keeps no state
  photo: Photo | null;
  texts: string[];
  plantName?: string;
  turns: number; // successful diagnoses so far
}

type MsgBody =
  | { kind: 'user'; text?: string; photoUrl?: string }
  | { kind: 'diagnosis'; result: DiagnosisResponse; update: boolean }
  | { kind: 'rejection'; reason?: string; hadPhoto: boolean }
  | { kind: 'error'; text: string; retry?: { input: DiagnoseInput; kase: Case } };

type Msg = MsgBody & { id: string; at: number };

/** A saved check-up shown in the thread: the photo that was sent, then the report. */
function messagesFromEntry(e: ConsultationEntry): Msg[] {
  const out: Msg[] = [];
  if (e.thumb) out.push({ id: `${e.id}-photo`, at: 0, kind: 'user', photoUrl: e.thumb });
  out.push({ id: `${e.id}-report`, at: 0, kind: 'diagnosis', result: e.result, update: false });
  return out;
}

function errorFor(e: any): { text: string; canRetry: boolean } {
  const status = e?.response?.status;
  if (status === 503) {
    return { text: 'Plant Doctor is taking a break right now. Please try later.', canRetry: false };
  }
  if (status === 429) {
    return { text: 'Plant Doctor is busy right now. Please try again later.', canRetry: true };
  }
  const serverMessage = e?.response?.data?.message;
  if (status === 422 && typeof serverMessage === 'string' && serverMessage) {
    return { text: serverMessage, canRetry: false };
  }
  return { text: "We couldn't complete the diagnosis. Please try again.", canRetry: true };
}

/* ────────────────────────────────────────────────────────────────────────────
   Small presentational pieces
   ──────────────────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#B58E39]">{children}</p>
  );
}

function HealthGauge({ score }: { score: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  const color = pct >= 70 ? '#2E5E2A' : pct >= 40 ? '#B58E39' : '#C0492B';
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EFECE3" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[17px] font-bold text-[#16301A]">
          {pct}
        </span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#184A31]">Overall health</p>
        <p className="text-[12.5px] text-[#8A8A8A]">
          {pct >= 70 ? 'Looking good — minor care needed.' : pct >= 40 ? 'Needs attention soon.' : 'Urgent care recommended.'}
        </p>
      </div>
    </div>
  );
}

function CareList({ title, items, accent }: { title: string; items?: string[]; accent?: boolean }) {
  if (!items || items.length === 0) return null;
  const Glyph = accent ? Check : Flower2;
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#8A8A8A]">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className={`flex gap-2.5 text-[13.5px] leading-relaxed ${accent ? 'text-[#184A31]' : 'text-[#5B5B5B]'}`}>
            <span className={`mt-[3px] shrink-0 ${accent ? 'text-[#24693E]' : 'text-[#C9C4B8]'}`}>
              <Glyph className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* The old hero's "how it works" cards, now three lines in the greeting. */
const STEPS = [
  { title: 'Snap a photo', copy: 'Natural light works best — focus on the affected leaves.' },
  { title: 'AI examines it', copy: 'Dr. Planty checks for disease, pests, watering and nutrient issues.' },
  { title: 'Get your care plan', copy: 'Clear fixes, prevention tips and remedies you can shop.' },
];

const ANALYZE_PHASES = [
  'Reading your photo…',
  'Identifying the plant…',
  'Scanning leaves for stress signals…',
  'Checking for pests & disease…',
  'Writing your care plan…',
];

/** "typing…" — the bouncing dots, plus what the doctor is doing right now. */
function TypingBubble({ hasPhoto }: { hasPhoto: boolean }) {
  const [phase, setPhase] = useState(hasPhoto ? 0 : 2);
  useEffect(() => {
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, ANALYZE_PHASES.length - 1)),
      2100,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`${BOT} flex items-center gap-2.5`}>
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#8696A0] motion-safe:animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span className="text-[13px] text-[#667781]">{ANALYZE_PHASES[phase]}</span>
    </div>
  );
}

/* ── The report, as a run of bubbles ──────────────────────────────────────── */

function DiagnosisBubbles({ result, update }: { result: DiagnosisResponse; update: boolean }) {
  const id = result.identification;
  return (
    <>
      {/* plant identity + health */}
      <div className={BOT_WIDE}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <Eyebrow>{update ? 'Updated diagnosis' : 'Diagnosis'}</Eyebrow>
            <h2 className="mt-1 text-[17px] font-semibold leading-snug text-[#184A31]">
              {id?.common_name || result.plant_name || 'Your plant'}
            </h2>
            {(id?.scientific_name || (id?.confidence ?? 0) > 0) && (
              <p className="mt-0.5 text-[12.5px] italic text-[#8A8A8A]">
                {id?.scientific_name}
                {typeof id?.confidence === 'number' && id.confidence > 0
                  ? `${id?.scientific_name ? ' · ' : ''}${Math.round(id.confidence * 100)}% match`
                  : ''}
              </p>
            )}
          </div>
          <HealthGauge score={result.overall_health_score} />
        </div>
      </div>

      {/* one bubble per condition */}
      {result.diagnosis?.map((d, i) => {
        const sev = SEVERITY_STYLE[d.severity] ?? SEVERITY_STYLE.medium;
        const hasMore = Boolean(d.causes?.length || d.preventive_measures?.length);
        return (
          <div key={i} className={`${BOT_WIDE} border-l-[3px]`} style={{ borderLeftColor: sev.bar }}>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h3 className="text-[15px] font-semibold text-[#184A31]">{d.condition}</h3>
              <span className={`rounded-full border px-2.5 py-[3px] text-[10px] font-bold uppercase leading-none tracking-wide ${sev.cls}`}>
                {sev.label}
              </span>
              {typeof d.confidence === 'number' && (
                <span className="text-[11.5px] text-[#8A8A8A]">{Math.round(d.confidence * 100)}% confidence</span>
              )}
            </div>
            {d.description && <p className="mt-1.5 text-[#5B5B5B]">{d.description}</p>}

            {d.solutions && d.solutions.length > 0 && (
              <div className="mt-3">
                <CareList title="What to do" items={d.solutions} accent />
              </div>
            )}

            {/* Causes and prevention fold away — the fix is what the shopper
                came for, and three open lists made one bubble a full screen. */}
            {hasMore && (
              <details className="group mt-3 border-t border-[#EFECE3] pt-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded text-[12.5px] font-semibold text-[#24693E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24693E]/40 [&::-webkit-details-marker]:hidden">
                  Why it happens &amp; how to prevent it
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <CareList title="Likely causes" items={d.causes} />
                  <CareList title="Prevent next time" items={d.preventive_measures} />
                </div>
              </details>
            )}

            {d.products_recommended && d.products_recommended.length > 0 && (
              <div className="mt-3 border-t border-[#EFECE3] pt-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#8A8A8A]">
                  Recommended remedies
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.products_recommended.map((p) => (
                    <Link
                      key={p}
                      href={`/plants/search?text=${encodeURIComponent(p)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3 py-1.5 text-[12.5px] font-semibold text-[#24693E] transition hover:bg-ds-btn hover:text-white"
                    >
                      {p}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {d.vet_consultation_needed && (
              <p className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#E9B7AE] bg-[#FBE2DE] px-3.5 py-2.5 text-[13px] text-[#A23022]">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  This may need an in-person expert.{' '}
                  <Link href="/garden-service" className="font-semibold underline underline-offset-2">
                    Book a garden visit
                  </Link>
                </span>
              </p>
            )}
          </div>
        );
      })}

      {result.immediate_action && (
        <div className={`${BUBBLE} w-full max-w-[560px] bg-[#16301A] text-white`}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#D8B768]">Do this now</p>
          <p className="mt-1.5 text-white/85">{result.immediate_action}</p>
        </div>
      )}
      {result.long_term_care && (
        <div className={BOT_WIDE}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A]">Long-term care</p>
          <p className="mt-1.5 text-[#5B5B5B]">{result.long_term_care}</p>
        </div>
      )}

      <p className="max-w-[560px] px-1 text-[11.5px] leading-relaxed text-[#667781]">
        Dr. Planty is AI-powered and can be wrong. For valuable or severely affected plants, consult a
        horticulturist.{' '}
        <Link href="/garden-service" className="font-semibold text-[#24693E] underline underline-offset-2">
          Need a real gardener? Book a visit
        </Link>
      </p>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────────── */

const SYMPTOM_CHIPS = [
  'Yellowing leaves',
  'Brown spots',
  'Drooping / wilting',
  'White powder on leaves',
  'Pests visible',
  'Leaves falling off',
];

/** Everything the shopper has said about this plant goes to the model as one
 *  note; keep the most recent part if it ever grows past this. */
const SYMPTOMS_MAX = 1500;

export default function PlantDoctorPage() {
  const { locale } = useRouter();
  const { data: flag } = usePlantDoctorEnabled();
  const enabled = flag?.data?.enabled ?? true;
  const { mutate, isLoading } = useDiagnose();
  const { isAuthorized } = useUser();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [kase, setKase] = useState<Case | null>(null);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Photo | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  /** Below lg the window shows one pane at a time. Both stay MOUNTED (hidden by
   *  CSS): unmounting the one that owns useDiagnose would drop a reply in flight. */
  const [pane, setPane] = useState<'chat' | 'history'>('chat');
  /** A saved check-up opened from the list — shown in place of the live thread. */
  const [viewing, setViewing] = useState<ConsultationEntry | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLLIElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  /** The history row holding the current Case's report, so an updated
   *  diagnosis replaces it instead of piling up a row per follow-up. */
  const savedRef = useRef<{ caseId: string; rowId: string } | null>(null);

  // History is client-only (auth cookie + server fetch / localStorage) —
  // rendered strictly after mount so SSR markup never diverges (React #418).
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<ConsultationEntry[]>([]);

  const { data: serverHistory, isLoading: historyLoading } = usePlantDoctorHistory();
  const { mutate: saveConsultation } = useSaveConsultation();
  const { mutate: deleteConsultation } = useDeleteConsultation();

  const serverEntries = useMemo(
    () => (serverHistory?.data ?? []).map(entryFromServer),
    [serverHistory],
  );
  const entries = isAuthorized ? serverEntries : history;

  useEffect(() => {
    setMounted(true);
    setHistory(readHistory());
  }, []);

  const shown = useMemo(() => (viewing ? messagesFromEntry(viewing) : messages), [viewing, messages]);

  // Keep the newest message in view: do nothing when it already is, land on
  // the START of a report taller than the view, otherwise bring its end up.
  //   md+    the thread is its own scroller — `nearest` does exactly that.
  //   phone  the PAGE scrolls and two sticky bars cover part of the viewport.
  //          scroll-margin can't describe that (the composer's height changes
  //          with chips/attachments, and a fixed margin over-scrolled the page
  //          past the composer), so measure the bars and scroll by the gap.
  useEffect(() => {
    const li = lastRef.current;
    if (!li || (!shown.length && !isLoading)) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (window.matchMedia('(min-width: 768px)').matches) {
      li.scrollIntoView({ block: 'nearest', behavior });
      return;
    }
    const top = PHONE_BARS + 12;
    const bottom = window.innerHeight - (formRef.current?.getBoundingClientRect().height ?? 0) - 12;
    const r = li.getBoundingClientRect();
    const dy =
      r.height > bottom - top || r.top < top ? r.top - top : r.bottom > bottom ? r.bottom - bottom : 0;
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior });
  }, [shown.length, isLoading]);

  // A pane swap (below lg) replaces the control that was just pressed — hand
  // focus to its counterpart so keyboard and screen-reader users are not
  // dropped on <body>. On a phone the panes are page content of very different
  // heights, so the page's scroll offset means nothing across a swap: the list
  // opens from its top (it used to open scrolled past its only row, looking
  // empty), and coming back restores where the conversation was left.
  const firstPane = useRef(true);
  const chatScrollY = useRef(0);
  useEffect(() => {
    if (firstPane.current) {
      firstPane.current = false;
      return;
    }
    (pane === 'history' ? backBtnRef : historyBtnRef).current?.focus({ preventScroll: true });
    if (!window.matchMedia('(min-width: 768px)').matches) {
      window.scrollTo({ top: pane === 'history' ? 0 : chatScrollY.current, behavior: 'instant' });
    }
  }, [pane]);

  function showHistory() {
    chatScrollY.current = window.scrollY;
    setPane('history');
  }

  function clearDraft() {
    setDraft(null);
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNote('That file is not an image. Please choose a photo.');
      return;
    }
    setNote(null);
    try {
      const b64 = await fileToScaledBase64(file);
      setDraft({ b64, url: `data:image/jpeg;base64,${b64}` });
      setViewing(null);
      setPane('chat');
      inputRef.current?.focus();
    } catch {
      setNote('Could not read that image. Try a different photo.');
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (enabled) void handleFile(e.dataTransfer.files?.[0]);
  }

  const push = (body: MsgBody) =>
    setMessages((prev) => [...prev, { ...body, id: newId(), at: Date.now() } as Msg]);

  const saveToHistory = useCallback(
    async (data: DiagnosisResponse, c: Case) => {
      let thumb: string | undefined;
      if (c.photo) {
        try { thumb = await makeThumb(c.photo.url); } catch { /* thumb is optional */ }
      }
      const worst = worstSeverity(data);
      const title = data.identification?.common_name || data.plant_name || 'Plant check-up';
      const previous = savedRef.current?.caseId === c.id ? savedRef.current.rowId : null;

      if (isAuthorized) {
        // Signed in — persist to the account (server prunes beyond its cap).
        // Fire-and-forget: history is a nicety, never block the diagnosis.
        saveConsultation(
          {
            plant_name: title,
            thumb,
            diagnosis: data,
            health_score: Math.round(
              Math.max(0, Math.min(1, data.overall_health_score ?? 0)) * 100,
            ),
            worst_severity: worst,
          },
          {
            onSuccess: (res) => {
              if (previous) deleteConsultation(Number(previous));
              savedRef.current = { caseId: c.id, rowId: String(res.data.id) };
            },
          },
        );
        return;
      }

      const entry: ConsultationEntry = {
        id: newId(),
        at: new Date().toISOString(),
        title,
        thumb,
        score: data.overall_health_score,
        severity: worst,
        conditions: (data.diagnosis ?? []).map((d) => d.condition).slice(0, 3),
        result: data,
      };
      savedRef.current = { caseId: c.id, rowId: entry.id };
      setHistory((prev) => {
        const next = [entry, ...prev.filter((e) => e.id !== previous)].slice(0, HISTORY_MAX);
        writeHistory(next);
        return next;
      });
    },
    [isAuthorized, saveConsultation, deleteConsultation],
  );

  /** One diagnosis round-trip. Also what an error bubble's "Try again" calls. */
  function run(input: DiagnoseInput, c: Case) {
    mutate(input, {
      onSuccess: (res) => {
        const data = res.data;
        if (data?.is_plant === false) {
          push({ kind: 'rejection', reason: data.rejection_reason, hadPhoto: Boolean(c.photo) });
          // Never carry a rejected photo into the next message.
          if (c.turns === 0) setKase((k) => (k?.id === c.id ? null : k));
          return;
        }
        const plantName = data.identification?.common_name || data.plant_name || c.plantName;
        setKase((k) => (k?.id === c.id ? { ...k, plantName, turns: c.turns + 1 } : k));
        push({ kind: 'diagnosis', result: data, update: c.turns > 0 });
        void saveToHistory(data, c);
      },
      onError: (e: any) => {
        const { text: message, canRetry } = errorFor(e);
        push({ kind: 'error', text: message, retry: canRetry ? { input, kase: c } : undefined });
      },
    });
  }

  function send() {
    const said = text.trim();
    if (isLoading || !enabled || (!said && !draft)) return;
    // A new photo is a new plant; words alone add to the one being discussed.
    const base: Case = draft || !kase ? { id: newId(), photo: draft, texts: [], turns: 0 } : kase;
    const next: Case = { ...base, texts: said ? [...base.texts, said] : base.texts };
    setKase(next);
    setViewing(null);
    setNote(null);
    setText('');
    push({ kind: 'user', text: said || undefined, photoUrl: draft?.url });
    clearDraft();
    run(
      {
        image_base64: next.photo?.b64,
        symptoms: next.texts.join('\n').slice(-SYMPTOMS_MAX) || undefined,
        plant_name: next.plantName,
        language: locale || 'en',
        session_id: next.id,
      },
      next,
    );
  }

  function newCheckup() {
    if (isLoading) return;
    setMessages([]);
    setKase(null);
    setViewing(null);
    setText('');
    setNote(null);
    clearDraft();
    savedRef.current = null;
    setPane('chat');
  }

  function toggleSymptom(chip: string) {
    setText((prev) => {
      if (prev.includes(chip)) {
        return prev
          .replace(`${chip}. `, '')
          .replace(chip, '')
          .trim();
      }
      return prev ? `${prev.replace(/\s+$/, '')} ${chip}. ` : `${chip}. `;
    });
    inputRef.current?.focus();
  }

  function openEntry(entry: ConsultationEntry) {
    chatScrollY.current = 0;
    setViewing(entry);
    setPane('chat');
    // Start a saved report from its top: the thread on md+, the page on a phone.
    requestAnimationFrame(() => {
      if (threadRef.current) threadRef.current.scrollTop = 0;
      if (!window.matchMedia('(min-width: 768px)').matches) window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  function deleteEntry(id: string) {
    if (!window.confirm('Delete this check-up from your history?')) return;
    if (isAuthorized) {
      deleteConsultation(Number(id));
    } else {
      setHistory((prev) => {
        const next = prev.filter((e) => e.id !== id);
        writeHistory(next);
        return next;
      });
    }
    setViewing((cur) => (cur?.id === id ? null : cur));
    if (savedRef.current?.rowId === id) savedRef.current = null;
  }

  const canSend = enabled && !isLoading && Boolean(text.trim() || draft);
  const lastMsg = messages[messages.length - 1];
  // Chips are a way to START describing the problem; once the conversation is
  // under way they are just noise above the composer.
  const showChips = messages.length === 0 && !viewing;
  // Words alone will be read against this photo — say so, and let it be dropped.
  const continuing = !draft && !viewing && kase?.photo && kase.turns > 0 ? kase : null;

  // One short line for screen readers instead of a live region over the whole
  // thread — a report is several hundred words and would be read out in full.
  const srStatus = isLoading
    ? 'Dr. Planty is examining your plant.'
    : lastMsg?.kind === 'diagnosis'
      ? `Diagnosis ready: ${lastMsg.result.identification?.common_name || lastMsg.result.plant_name || 'your plant'}, health ${Math.round(Math.max(0, Math.min(1, lastMsg.result.overall_health_score ?? 0)) * 100)} out of 100.`
      : lastMsg?.kind === 'rejection' || lastMsg?.kind === 'error'
        ? 'Plant Doctor replied — see the conversation.'
        : '';

  return (
    <div className="bg-[#FAF9F6] md:px-6 md:pb-6">
      <div className="mx-auto hidden h-11 w-full max-w-6xl items-center md:flex">
        <Breadcrumb items={[{ label: 'Home', href: Routes.home }, { label: 'Plant Doctor' }]} />
      </div>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          if (enabled) setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
        }}
        onDrop={onDrop}
        className="relative mx-auto flex min-h-[calc(100svh-58px)] w-full flex-col bg-white md:h-[calc(100dvh-126px)] md:min-h-[480px] md:max-h-[860px] md:max-w-6xl md:overflow-hidden md:rounded-2xl md:border md:border-kraft-200 md:shadow-box lg:h-[calc(100dvh-136px)] lg:flex-row"
      >
        {/* ── CHAT ── first in the DOM so the h1 leads; from lg it sits right of the list */}
        <div className={`${pane === 'chat' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col lg:flex`}>
          <header className="sticky top-[58px] z-20 flex h-14 shrink-0 items-center gap-3 border-b border-kraft-200 bg-white px-3 md:static md:px-4 lg:h-16">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ds-btn text-white">
              <Flower2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold leading-tight text-[#184A31] lg:text-[16px]">
                AI Plant Doctor
              </h1>
              <p className="truncate text-[12px] leading-tight text-[#667781]">
                {isLoading
                  ? 'examining your plant…'
                  : viewing
                    ? `Saved check-up · ${formatDate(viewing.at)}`
                    : 'Dr. Planty · photo-based plant health check'}
              </p>
            </div>
            {(messages.length > 0 || viewing) && (
              <button
                type="button"
                onClick={newCheckup}
                disabled={isLoading}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-kraft-200 px-3 text-[12.5px] font-semibold text-[#24693E] transition hover:bg-[#F3F8EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24693E]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="max-[380px]:sr-only">New check-up</span>
              </button>
            )}
            <button
              ref={historyBtnRef}
              type="button"
              onClick={showHistory}
              aria-label="Your past check-ups"
              className={`${ICON_BTN} relative lg:hidden`}
            >
              <RotateCcw className="h-5 w-5" aria-hidden />
              {mounted && entries.length > 0 && (
                <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ds-btn px-1 text-[10px] font-bold leading-none text-white">
                  {entries.length}
                </span>
              )}
            </button>
          </header>

          <div
            ref={threadRef}
            role="region"
            aria-label="Conversation with Plant Doctor"
            tabIndex={0}
            className="relative flex-1 px-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#24693E]/30 sm:px-5 md:min-h-0 md:overflow-y-auto md:overscroll-contain lg:px-8"
            style={{ backgroundColor: '#EFEAE2', backgroundImage: WALLPAPER }}
          >
            <ol className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {viewing ? (
                <li className="self-center">
                  <button
                    type="button"
                    onClick={() => setViewing(null)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-semibold text-[#24693E] shadow-[0_1px_1px_rgba(11,20,26,0.08)] transition hover:bg-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    Back to the current chat
                  </button>
                </li>
              ) : !enabled ? (
                <li className={`${ITEM} items-start`}>
                  <div className={BOT}>
                    <p className="font-semibold">Plant Doctor is coming soon</p>
                    <p className="mt-1 text-[#5B5B5B]">
                      We&rsquo;re putting the finishing touches on it. Check back shortly.
                    </p>
                  </div>
                </li>
              ) : (
                /* The greeting is static JSX, not a message in state: it is in
                   the server-rendered HTML (this is the page's indexable copy —
                   the old hero's sentences, verbatim) and it never re-times. */
                <li className={`${ITEM} items-start`}>
                  <div className={BOT_WIDE}>
                    <p className="text-[15px] font-semibold leading-snug">
                      Is your plant unwell? Find out in seconds.
                    </p>
                    <p className="mt-1.5 text-[#5B5B5B]">
                      Upload a photo of the leaves or describe the symptoms. Dr. Planty checks for disease,
                      pests, over/under-watering and nutrient issues — and tells you exactly how to fix it.
                    </p>
                  </div>
                  <div className={BOT_WIDE}>
                    <Eyebrow>How it works</Eyebrow>
                    <ol className="mt-2 space-y-1.5">
                      {STEPS.map((s, i) => (
                        <li key={s.title} className="flex gap-2.5">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#F3F8EC] text-[11px] font-bold leading-none text-[#24693E]">
                            {i + 1}
                          </span>
                          <span className="text-[#5B5B5B]">
                            <span className="font-semibold text-[#184A31]">{s.title}.</span> {s.copy}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className={QUICK_BTN}>
                        <Camera className="h-4 w-4" aria-hidden />
                        Upload a photo
                      </button>
                      {/* `capture` only means something on a phone */}
                      <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className={`${QUICK_BTN} md:hidden`}
                      >
                        Use camera
                      </button>
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-[#667781]">
                      Photo tips: use natural light and avoid flash, focus on the affected leaves, and
                      include the whole plant if you can. Results are AI-generated guidance.
                    </p>
                  </div>
                </li>
              )}

              {shown.map((m, i) => {
                const isLast = i === shown.length - 1 && !(isLoading && !viewing);
                const time = m.at ? formatTime(m.at) : '';

                if (m.kind === 'user') {
                  // "read" ticks once the doctor has answered
                  const answered = Boolean(viewing) || i < shown.length - 1;
                  return (
                    <li key={m.id} ref={isLast ? lastRef : undefined} className={`${ITEM} items-end`}>
                      <div className={USER}>
                        {m.photoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.photoUrl}
                            alt="Your plant"
                            className={`rounded-xl object-cover ${viewing ? 'h-28 w-28' : 'max-h-64 w-full max-w-[260px]'} ${m.text ? 'mb-1.5' : ''}`}
                          />
                        )}
                        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                        <span className="mt-1 flex items-center justify-end gap-1 text-[10.5px] leading-none text-[#667781]">
                          {time}
                          <Checks className={`h-4 w-4 ${answered ? 'text-[#53BDEB]' : 'text-[#8696A0]'}`} aria-hidden />
                        </span>
                      </div>
                    </li>
                  );
                }

                if (m.kind === 'diagnosis') {
                  return (
                    <li key={m.id} ref={isLast ? lastRef : undefined} className={`${ITEM} items-start`}>
                      <DiagnosisBubbles result={m.result} update={m.update} />
                      {time && <span className="px-1 text-[10.5px] leading-none text-[#667781]">{time}</span>}
                    </li>
                  );
                }

                if (m.kind === 'rejection') {
                  return (
                    <li key={m.id} ref={isLast ? lastRef : undefined} className={`${ITEM} items-start`}>
                      <div className={BOT}>
                        <p className="font-semibold">
                          {m.hadPhoto
                            ? 'I couldn’t find a plant in that photo.'
                            : 'I couldn’t work out a diagnosis from that.'}
                        </p>
                        <p className="mt-1 text-[#5B5B5B]">
                          {m.reason ||
                            (m.hadPhoto
                              ? 'Please send a clear, well-lit photo of the plant or the affected leaf.'
                              : 'A photo helps most — or tell me the plant and what you see on its leaves.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className={`${QUICK_BTN} mt-2.5`}
                        >
                          <Camera className="h-4 w-4" aria-hidden />
                          {m.hadPhoto ? 'Try another photo' : 'Add a photo'}
                        </button>
                      </div>
                      <span className="px-1 text-[10.5px] leading-none text-[#667781]">{time}</span>
                    </li>
                  );
                }

                return (
                  <li key={m.id} ref={isLast ? lastRef : undefined} className={`${ITEM} items-start`}>
                    <div className={`${BUBBLE} w-fit max-w-[92%] border border-[#E9B7AE] bg-[#FBE2DE] text-[#A23022] sm:max-w-[78%]`}>
                      <p className="flex items-start gap-2">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>{m.text}</span>
                      </p>
                      {/* only the newest failure can be retried — an older one
                          has been superseded by whatever came after it */}
                      {m.retry && i === shown.length - 1 && !isLoading && (
                        <button
                          type="button"
                          onClick={() => m.retry && run(m.retry.input, m.retry.kase)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#A23022]/40 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#A23022] transition hover:bg-[#A23022] hover:text-white"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          Try again
                        </button>
                      )}
                    </div>
                    <span className="px-1 text-[10.5px] leading-none text-[#667781]">{time}</span>
                  </li>
                );
              })}

              {isLoading && !viewing && (
                <li ref={lastRef} className={`${ITEM} items-start`}>
                  <TypingBubble hasPhoto={Boolean(kase?.photo)} />
                </li>
              )}
            </ol>
          </div>

          <p className="sr-only" role="status">
            {srStatus}
          </p>

          {enabled && (
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              // The bottom padding below md is the fixed bottom nav's height
              // (58.5px + its safe-area inset): the composer sticks to the
              // viewport bottom UNDER the nav and pads its own controls clear.
              className="sticky bottom-0 z-20 shrink-0 border-t border-kraft-200 bg-[#F0F2F5] px-2.5 pb-[calc(60px+max(8px,env(safe-area-inset-bottom)))] pt-2 md:static md:px-4 md:pb-3"
            >
              {showChips && (
                <div className="-mx-2.5 mb-2 flex gap-2 overflow-x-auto px-2.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                  {SYMPTOM_CHIPS.map((chip) => {
                    const active = text.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleSymptom(chip)}
                        aria-pressed={active}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                          active
                            ? 'border-ds-btn bg-ds-btn text-white'
                            : 'border-kraft-200 bg-white text-[#54656F] hover:border-[#24693E]/50 hover:text-[#24693E]'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              )}

              {note && (
                <p role="alert" className="mb-2 flex items-start gap-2 text-[12.5px] text-[#A23022]">
                  <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden />
                  {note}
                </p>
              )}

              {draft ? (
                <div className="mb-2 flex w-fit max-w-full items-center gap-2.5 rounded-xl border border-kraft-200 bg-white py-1.5 pl-1.5 pr-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 text-[12.5px] font-medium text-[#184A31]">Photo attached</span>
                  <button type="button" onClick={clearDraft} aria-label="Remove the attached photo" className={`${ICON_BTN} !h-9 !w-9`}>
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : continuing ? (
                <div className="mb-2 flex w-fit max-w-full items-center gap-2.5 rounded-xl border border-kraft-200 bg-white py-1.5 pl-1.5 pr-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={continuing.photo!.url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 truncate text-[12.5px] text-[#54656F]">
                    Adding to:{' '}
                    <span className="font-semibold text-[#184A31]">{continuing.plantName || 'your photo'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setKase(null)}
                    disabled={isLoading}
                    aria-label="Stop adding to this plant — start a new check-up with your next message"
                    className={`${ICON_BTN} !h-9 !w-9`}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}

              <div className="flex items-end gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach a photo of your plant"
                  className={ICON_BTN}
                >
                  <Plus className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  aria-label="Take a photo with the camera"
                  className={`${ICON_BTN} md:hidden`}
                >
                  <Camera className="h-[22px] w-[22px]" aria-hidden />
                </button>
                <label htmlFor="pd-message" className="sr-only">
                  Describe what is wrong with your plant
                </label>
                {/* 16px on phones: anything smaller makes iOS zoom the page on focus. */}
                <textarea
                  id="pd-message"
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends with a keyboard; on a touch keyboard it stays a new line.
                    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
                    if (window.matchMedia('(pointer: coarse)').matches) return;
                    e.preventDefault();
                    send();
                  }}
                  rows={1}
                  maxLength={500}
                  placeholder={draft ? 'Add a note (optional)' : 'Describe what’s wrong…'}
                  className="mx-1 max-h-28 min-h-[44px] flex-1 resize-none rounded-control border border-kraft-200 bg-white px-3.5 py-2.5 text-[16px] leading-snug text-[#111B21] outline-none [field-sizing:content] placeholder:text-[#8696A0] focus:border-[#24693E]/60 md:text-[14px]"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send to Plant Doctor"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ds-btn text-white transition hover:bg-ds-btn-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24693E]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <input
                id="pd-file"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleFile(e.target.files?.[0])}
                className="hidden"
              />
              <input
                id="pd-camera"
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => void handleFile(e.target.files?.[0])}
                className="hidden"
              />
            </form>
          )}
        </div>

        {/* ── PAST CHECK-UPS ── the "chat list": a pane on the left from lg,
            swapped in by the History button below it. */}
        <aside
          aria-label="Your past check-ups"
          className={`${pane === 'history' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col bg-white pb-[calc(60px+max(8px,env(safe-area-inset-bottom)))] md:pb-0 lg:order-first lg:flex lg:w-80 lg:flex-none lg:border-r lg:border-kraft-200`}
        >
          <div className="sticky top-[58px] z-20 flex h-14 shrink-0 items-center gap-1 border-b border-kraft-200 bg-white px-2 md:static lg:h-16 lg:px-4">
            <button
              ref={backBtnRef}
              type="button"
              onClick={() => setPane('chat')}
              aria-label="Back to the chat"
              className={`${ICON_BTN} lg:hidden`}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <h2 className="flex-1 text-[15px] font-semibold text-[#184A31] lg:text-[16px]">Your check-ups</h2>
          </div>

          {/* Client-only: auth and localStorage are unknown on the server, so
              nothing here renders until after mount. */}
          {mounted && (
            <>
              {entries.length === 0 ? (
                <p className="flex-1 px-4 py-6 text-[13px] leading-relaxed text-[#667781]">
                  {isAuthorized && historyLoading
                    ? 'Loading your check-ups…'
                    : 'Your past check-ups will appear here after your first diagnosis.'}
                </p>
              ) : (
                <ul className="flex-1 divide-y divide-kraft-200/70 md:min-h-0 md:overflow-y-auto md:overscroll-contain">
                  {entries.map((e) => {
                    const sev = SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.medium;
                    const pct = Math.round(Math.max(0, Math.min(1, e.score)) * 100);
                    return (
                      <li key={e.id} className="flex items-stretch">
                        <button
                          type="button"
                          onClick={() => openEntry(e)}
                          aria-current={viewing?.id === e.id ? 'true' : undefined}
                          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-1 text-left transition hover:bg-[#F5F6F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#24693E]/40 aria-[current=true]:bg-[#F0F2F5]"
                        >
                          {e.thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.thumb} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F3F8EC] text-[#24693E]/60">
                              <Flower2 className="h-5 w-5" aria-hidden />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-semibold text-[#111B21]">{e.title}</span>
                            <span className="mt-1 flex items-center gap-1.5">
                              <span className={`shrink-0 rounded-full border px-2 py-[2px] text-[10px] font-bold uppercase leading-none tracking-wide ${sev.cls}`}>
                                {sev.label}
                              </span>
                              <span className="truncate text-[12px] text-[#667781]">
                                Health {pct} · {formatDate(e.at)}
                              </span>
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(e.id)}
                          aria-label={`Delete the check-up for ${e.title}`}
                          className={`${ICON_BTN} my-auto mr-1 !h-9 !w-9 hover:!text-[#C0492B]`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="shrink-0 border-t border-kraft-200/70 px-4 py-3 text-[11.5px] leading-relaxed text-[#667781]">
                {isAuthorized ? (
                  'Check-ups are saved privately to your account.'
                ) : (
                  <>
                    Saved on this device only.{' '}
                    <Link href={Routes.login} className="font-semibold text-[#24693E] underline underline-offset-2">
                      Sign in
                    </Link>{' '}
                    to save future check-ups to your account.
                  </>
                )}
              </p>
            </>
          )}
        </aside>

        {drag && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center border-2 border-dashed border-[#24693E] bg-[#F3F8EC]/90 text-[14px] font-semibold text-[#24693E] md:rounded-2xl">
            Drop the photo to attach it
          </div>
        )}
      </section>
    </div>
  );
}

PlantDoctorPage.getLayout = getSiteLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <PlantDoctorPage {...props} />;
  const withLayout = (PlantDoctorPage as any).getLayout ? (PlantDoctorPage as any).getLayout(page) : page;
  return withLayout;
}
