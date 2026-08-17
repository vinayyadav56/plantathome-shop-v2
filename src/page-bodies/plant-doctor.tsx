'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import { BrandSpinner } from '@/components/ui/plant-loader';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Seo from '@/components/seo/seo';
import { Routes } from '@/config/routes';
import { useUser } from '@/framework/user';
import {
  useDiagnose,
  usePlantDoctorEnabled,
  usePlantDoctorHistory,
  useSaveConsultation,
  useDeleteConsultation,
  ConsultationRecord,
  DiagnosisResponse,
  Severity,
} from '@/framework/plant-doctor';
import {
  ArrowRight, Camera, Check, ChevronDown, CircleAlert, Clock, FileText, Sprout, Lock, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Trash2, type LucideIcon,
} from '@/components/ui/icon';

/* ────────────────────────────────────────────────────────────────────────────
   Design tokens (storefront design language — matches products/cards/plantathome)
   ──────────────────────────────────────────────────────────────────────────── */

const CARD =
  'rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]';

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2.5 rounded-[14px] bg-[#14532D] px-7 py-3.5 text-[14px] font-semibold text-white transition duration-300 hover:bg-[#0D4324] active:scale-[0.98] disabled:opacity-60 disabled:hover:bg-[#14532D]';

const SEVERITY_STYLE: Record<Severity, { label: string; cls: string; bar: string }> = {
  low:      { label: 'Low',      cls: 'bg-[#F3F8EC] text-[#24693E] border-[#DCE8D3]', bar: '#2E5E2A' },
  medium:   { label: 'Medium',   cls: 'bg-[#FBF1DD] text-[#8A6A23] border-[#E8D4A8]', bar: '#B58E39' },
  high:     { label: 'High',     cls: 'bg-[#FBE7DA] text-[#9A4F1E] border-[#E6C3A3]', bar: '#C07035' },
  critical: { label: 'Critical', cls: 'bg-[#FBE2DE] text-[#A23022] border-[#E9B7AE]', bar: '#C0492B' },
};

const SEV_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ────────────────────────────────────────────────────────────────────────────
   Icons — Lucide glyphs via the shared funnel, keyed by the old local names
   ──────────────────────────────────────────────────────────────────────────── */

const ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  leaf: Sprout,
  clipboard: FileText,
  shield: ShieldCheck,
  clock: Clock,
  lock: Lock,
  history: RotateCcw,
  refresh: RefreshCw,
  trash: Trash2,
  alert: CircleAlert,
  check: Check,
  arrowRight: ArrowRight,
  chevronDown: ChevronDown,
  sparkle: Sparkles,
  image: Camera,
};

function Icon({
  name,
  className = 'h-4 w-4',
}: {
  name: keyof typeof ICONS;
  className?: string;
}) {
  const Glyph = ICONS[name] ?? Sprout;
  return <Glyph className={className} aria-hidden />;
}

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

/** Tiny thumbnail for the history rail — keeps localStorage well under quota. */
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
   Consultation history — signed-in users read/write the server
   (plant-doctor/consultations); localStorage remains ONLY as the signed-out
   fallback. Everything renders strictly after mount (hydration-safe).
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

/** Map a server-side consultation row onto the shape the history rail renders. */
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

/* ────────────────────────────────────────────────────────────────────────────
   Small presentational pieces
   ──────────────────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B58E39]">{children}</p>
  );
}

function HealthGauge({ score }: { score: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  const color = pct >= 70 ? '#2E5E2A' : pct >= 40 ? '#B58E39' : '#C0492B';
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EFECE3" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#16301A]">
          {pct}
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[#184A31]">Overall health</p>
        <p className="text-[13px] text-[#8A8A8A]">
          {pct >= 70 ? 'Looking good — minor care needed.' : pct >= 40 ? 'Needs attention soon.' : 'Urgent care recommended.'}
        </p>
      </div>
    </div>
  );
}

function CareList({ title, items, accent }: { title: string; items?: string[]; accent?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#8A8A8A]">{title}</p>
      <ul className="mt-2.5 space-y-2">
        {items.map((it, i) => (
          <li key={i} className={`flex gap-2.5 text-[13.5px] leading-relaxed ${accent ? 'text-[#184A31]' : 'text-[#5B5B5B]'}`}>
            <span className={`mt-[3px] shrink-0 ${accent ? 'text-[#24693E]' : 'text-[#C9C4B8]'}`}>
              <Icon name={accent ? 'check' : 'leaf'} className="h-3.5 w-3.5" />
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Guided 3-step strip ──────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: 'camera' as const,
    title: 'Snap a photo',
    copy: 'Natural light works best — focus on the affected leaves.',
  },
  {
    icon: 'sparkle' as const,
    title: 'AI examines it',
    copy: 'Dr. Planty checks for disease, pests, watering and nutrient issues.',
  },
  {
    icon: 'clipboard' as const,
    title: 'Get your care plan',
    copy: 'Clear fixes, prevention tips and remedies you can shop.',
  },
];

function StepsStrip() {
  return (
    <div className="mx-auto mt-9 grid max-w-4xl gap-3.5 sm:grid-cols-3">
      {STEPS.map((s, i) => (
        <div key={s.title} className={`${CARD} relative p-5 text-left`}>
          <span className="absolute right-4 top-4 text-[26px] font-bold leading-none text-[#EFECE3]">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F3F8EC] text-[#24693E]">
            <Icon name={s.icon} className="h-5 w-5" />
          </span>
          <p className="mt-3.5 text-[15px] font-bold text-[#184A31]">{s.title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8A8A8A]">{s.copy}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Friendly progress treatment while the AI works ───────────────────────── */

const ANALYZE_PHASES = [
  'Reading your photo…',
  'Identifying the plant…',
  'Scanning leaves for stress signals…',
  'Checking for pests & disease…',
  'Writing your care plan…',
];

function AnalyzingView({ preview }: { preview: string | null }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, ANALYZE_PHASES.length - 1)),
      2100,
    );
    return () => clearInterval(t);
  }, []);
  const pct = Math.round(((phase + 1) / ANALYZE_PHASES.length) * 88);

  return (
    <div className={`${CARD} mx-auto max-w-2xl overflow-hidden`}>
      {preview && (
        <div className="relative h-56 w-full overflow-hidden bg-[#F7F5EF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your plant" className="h-full w-full object-cover" />
          {/* scan line */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-[pd-scan_2.4s_ease-in-out_infinite] bg-[linear-gradient(to_bottom,transparent,rgba(243,248,236,0.55),transparent)]" />
        </div>
      )}
      <div className="p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F8EC] text-[#24693E]">
          <BrandSpinner className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[18px] font-bold text-[#184A31]">Dr. Planty is examining your plant</p>
        <p aria-live="polite" className="mt-1.5 text-[13.5px] text-[#5B5B5B]">{ANALYZE_PHASES[phase]}</p>
        <div className="mx-auto mt-5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[#EFECE3]">
          <span
            className="block h-full rounded-full bg-[#14532D] transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-[11.5px] text-[#8A8A8A]">Usually takes 5–15 seconds.</p>
      </div>
      <style>{`@keyframes pd-scan{0%{transform:translateY(-4rem)}55%{transform:translateY(14rem)}100%{transform:translateY(14rem)}}`}</style>
    </div>
  );
}

/* ── Results ──────────────────────────────────────────────────────────────── */

function DiagnosisView({ result, onReset }: { result: DiagnosisResponse; onReset: () => void }) {
  return (
    <div className="space-y-5">
      {/* plant identity + health */}
      <div className={`${CARD} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <Eyebrow>Diagnosis report</Eyebrow>
            <h2 className="mt-1.5 text-[1.9rem] font-medium leading-tight tracking-[-0.01em] text-[#184A31]">
              {result.identification?.common_name || result.plant_name || 'Your plant'}
            </h2>
            {(result.identification?.scientific_name || (result.identification?.confidence ?? 0) > 0) && (
              <p className="mt-1 text-[14px] italic text-[#8A8A8A]">
                {result.identification?.scientific_name}
                {typeof result.identification?.confidence === 'number' && result.identification.confidence > 0
                  ? ` · ${Math.round(result.identification.confidence * 100)}% match`
                  : ''}
              </p>
            )}
          </div>
          <HealthGauge score={result.overall_health_score} />
        </div>
      </div>

      {/* per-condition cards */}
      {result.diagnosis?.map((d, i) => {
        const sev = SEVERITY_STYLE[d.severity] ?? SEVERITY_STYLE.medium;
        return (
          <div key={i} className={`${CARD} overflow-hidden`}>
            <div className="h-1 w-full" style={{ background: sev.bar }} />
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[1.15rem] font-medium text-[#184A31]">{d.condition}</h3>
                <span className={`rounded-full border px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-wide ${sev.cls}`}>
                  {sev.label}
                </span>
                {typeof d.confidence === 'number' && (
                  <span className="text-[11.5px] text-[#8A8A8A]">{Math.round(d.confidence * 100)}% confidence</span>
                )}
              </div>
              {d.description && (
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#5B5B5B]">{d.description}</p>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <CareList title="Likely causes" items={d.causes} />
                <CareList title="What to do" items={d.solutions} accent />
                <CareList title="Prevent next time" items={d.preventive_measures} />
              </div>

              {d.products_recommended && d.products_recommended.length > 0 && (
                <div className="mt-6 border-t border-[#EFECE3] pt-4">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#8A8A8A]">
                    Recommended remedies
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {d.products_recommended.map((p) => (
                      <Link
                        key={p}
                        href={`/plants/search?text=${encodeURIComponent(p)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#24693E] transition hover:bg-[#14532D] hover:text-white"
                      >
                        {p}
                        <Icon name="arrowRight" className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {d.vet_consultation_needed && (
                <p className="mt-5 flex items-start gap-2.5 rounded-[14px] border border-[#E9B7AE] bg-[#FBE2DE] px-4 py-3 text-[13px] text-[#A23022]">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    This may need an in-person expert.{' '}
                    <Link href="/garden-service" className="font-semibold underline underline-offset-2">
                      Book a garden visit
                    </Link>
                  </span>
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* immediate (dark forest band) + long term */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-[22px] bg-[#16301A] p-6 text-white sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
          />
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(ellipse,rgba(231,238,226,0.16)_0%,transparent_70%)]" />
          <p className="relative text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#B58E39]">Do this now</p>
          <p className="relative mt-2.5 text-[14px] leading-relaxed text-white/80">{result.immediate_action}</p>
        </div>
        <div className={`${CARD} p-6 sm:p-7`}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A]">Long-term care</p>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[#5B5B5B]">{result.long_term_care}</p>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button onClick={onReset} className={BTN_PRIMARY}>
          <Icon name="refresh" className="h-4 w-4" />
          Diagnose another plant
        </button>
        <Link
          href="/garden-service"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#24693E] underline underline-offset-4 transition hover:text-[#14532D]"
        >
          Need a real gardener? Book a visit
          <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="text-[11.5px] text-[#8A8A8A]">
        Dr. Planty is AI-powered and can be wrong. For valuable or severely affected plants, consult a horticulturist.
      </p>
    </div>
  );
}

function RejectionView({ result, onReset }: { result: DiagnosisResponse; onReset: () => void }) {
  return (
    <div className={`${CARD} mx-auto max-w-xl p-8 text-center sm:p-10`}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F3F8EC] text-[#24693E]">
        <Icon name="image" className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-[1.5rem] font-medium leading-tight text-[#184A31]">
        We couldn&rsquo;t find a plant in that photo
      </h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[#5B5B5B]">
        {result.rejection_reason || 'Please upload a clear, well-lit photo of the plant or the affected leaf.'}
      </p>
      <button onClick={onReset} className={`${BTN_PRIMARY} mt-6`}>
        <Icon name="camera" className="h-4 w-4" />
        Try another photo
      </button>
    </div>
  );
}

/* ── Previous consultations ───────────────────────────────────────────────── */

function HistorySection({
  entries,
  loading = false,
  server = false,
  expandedId,
  onToggle,
  onOpen,
  onDelete,
  onClear,
}: {
  entries: ConsultationEntry[];
  loading?: boolean;
  server?: boolean;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onOpen: (e: ConsultationEntry) => void;
  onDelete: (id: string) => void;
  onClear?: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Your history</Eyebrow>
          <h2 className="mt-1.5 flex items-center gap-2.5 text-[1.5rem] font-medium tracking-[-0.01em] text-[#184A31]">
            Previous consultations
            {entries.length > 0 && (
              <span className="rounded-full bg-[#F3F8EC] px-2.5 py-1 text-[12px] font-semibold text-[#24693E]">
                {entries.length}
              </span>
            )}
          </h2>
        </div>
        {entries.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#8A8A8A] transition hover:text-[#C0492B]"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className={`${CARD} mt-5 flex items-center gap-4 p-6`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F3F8EC] text-[#24693E]">
            <Icon name="history" className="h-5 w-5" />
          </span>
          <p className="text-[13.5px] leading-relaxed text-[#5B5B5B]">
            {loading
              ? 'Loading your consultations…'
              : server
                ? 'Your past check-ups will appear here after your first diagnosis.'
                : 'Your past check-ups will appear here after your first diagnosis on this device.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => {
            const sev = SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.medium;
            const open = expandedId === e.id;
            const pct = Math.round(Math.max(0, Math.min(1, e.score)) * 100);
            return (
              <article key={e.id} className={`${CARD} flex flex-col overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => onToggle(e.id)}
                  className="flex w-full items-center gap-3.5 p-4 text-left"
                  aria-expanded={open}
                >
                  {e.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.thumb}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-[14px] object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#F7F5EF] text-[#24693E]/50">
                      <Icon name="leaf" className="h-6 w-6" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] text-[#8A8A8A]">{formatDate(e.at)}</span>
                    <span className="mt-0.5 block truncate text-[14.5px] font-bold text-[#184A31]">
                      {e.title}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide ${sev.cls}`}>
                        {sev.label}
                      </span>
                      <span className="text-[11px] text-[#8A8A8A]">Health {pct}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 text-[#8A8A8A] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    <Icon name="chevronDown" className="h-4 w-4" />
                  </span>
                </button>

                {open && (
                  <div className="border-t border-[#EFECE3] px-4 pb-4 pt-3.5">
                    {e.conditions.length > 0 && (
                      <ul className="space-y-1.5">
                        {e.conditions.map((c, i) => (
                          <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-[#5B5B5B]">
                            <span className="mt-[3px] shrink-0 text-[#24693E]">
                              <Icon name="check" className="h-3 w-3" />
                            </span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.result.immediate_action && (
                      <p className="mt-2.5 text-[12px] leading-relaxed text-[#8A8A8A] line-clamp-2">
                        {e.result.immediate_action}
                      </p>
                    )}
                    <div className="mt-3.5 flex items-center gap-3">
                      <button
                        onClick={() => onOpen(e)}
                        className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#14532D] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#0D4324]"
                      >
                        Open full report
                        <Icon name="arrowRight" className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        className="inline-flex items-center gap-1 text-[12px] text-[#8A8A8A] transition hover:text-[#C0492B]"
                        aria-label="Remove from history"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-[11.5px] text-[#8A8A8A]">
        {server
          ? 'Consultations are saved privately to your account.'
          : 'Consultations are saved privately on this device.'}
      </p>
    </div>
  );
}

function HistoryLoginTeaser() {
  return (
    <div className={`${CARD} relative overflow-hidden p-7 sm:p-8`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(ellipse,rgba(231,238,226,0.9)_0%,transparent_70%)]" />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#F3F8EC] text-[#24693E]">
          <Icon name="lock" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="text-[1.15rem] font-medium text-[#184A31]">
            Log in to keep your consultation history
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#5B5B5B]">
            Sign in and every diagnosis is saved here — revisit past check-ups and track how your
            plants recover over time.
          </p>
        </div>
        <Link
          href={Routes.login}
          className="inline-flex shrink-0 items-center gap-2 rounded-[14px] bg-[#14532D] px-6 py-3 text-[13.5px] font-semibold text-white transition hover:bg-[#0D4324]"
        >
          Sign in
          <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
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

export default function PlantDoctorPage() {
  const { locale } = useRouter();
  const { data: flag } = usePlantDoctorEnabled();
  const enabled = flag?.data?.enabled ?? true;
  const { mutate, isLoading } = useDiagnose();
  const { isAuthorized } = useUser();

  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [plantName, setPlantName] = useState('');
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // History is client-only (auth + server fetch / localStorage fallback) —
  // rendered strictly after mount so SSR markup never diverges (React #418
  // hydration class). Signed-in: server rows via react-query. Signed-out:
  // the on-device localStorage list (behind the login teaser as before).
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<ConsultationEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    try {
      const b64 = await fileToScaledBase64(file);
      setImageB64(b64);
      setPreview(`data:image/jpeg;base64,${b64}`);
    } catch {
      setError('Could not read that image. Try a different photo.');
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  const saveToHistory = useCallback(
    async (data: DiagnosisResponse, photo: string | null, fallbackName: string) => {
      let thumb: string | undefined;
      if (photo) {
        try { thumb = await makeThumb(photo); } catch { /* thumb is optional */ }
      }
      const worst = worstSeverity(data);
      const title =
        data.identification?.common_name || data.plant_name || fallbackName || 'Plant check-up';

      if (isAuthorized) {
        // Signed in — persist to the account (server prunes beyond its cap).
        // Fire-and-forget: history is a nicety, never block the diagnosis.
        saveConsultation({
          plant_name: title,
          thumb,
          diagnosis: data,
          health_score: Math.round(
            Math.max(0, Math.min(1, data.overall_health_score ?? 0)) * 100,
          ),
          worst_severity: worst,
        });
        return;
      }

      const entry: ConsultationEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        title,
        thumb,
        score: data.overall_health_score,
        severity: worst,
        conditions: (data.diagnosis ?? []).map((d) => d.condition).slice(0, 3),
        result: data,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, HISTORY_MAX);
        writeHistory(next);
        return next;
      });
    },
    [isAuthorized, saveConsultation],
  );

  function submit() {
    setError(null);
    if (!imageB64 && !symptoms.trim()) {
      setError('Add a photo or describe the symptoms.');
      return;
    }
    const fallbackName = plantName.trim();
    const photo = preview;
    mutate(
      {
        image_base64: imageB64 ?? undefined,
        symptoms: symptoms.trim() || undefined,
        plant_name: fallbackName || undefined,
        language: locale || 'en',
      },
      {
        onSuccess: (res) => {
          setResult(res.data);
          if (res.data?.is_plant !== false) {
            void saveToHistory(res.data, photo, fallbackName);
          }
        },
        onError: (e: any) => {
          const status = e?.response?.status;
          setError(
            status === 503
              ? 'Plant Doctor is taking a break right now. Please try later.'
              : "We couldn't complete the diagnosis. Please try again.",
          );
        },
      },
    );
  }

  function reset() {
    setResult(null); setPreview(null); setImageB64(null);
    setSymptoms(''); setPlantName('');
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  function toggleSymptom(chip: string) {
    setSymptoms((prev) => {
      if (prev.includes(chip)) {
        return prev
          .replace(`${chip}. `, '')
          .replace(chip, '')
          .trim();
      }
      return prev ? `${prev.replace(/\s+$/, '')} ${chip}. ` : `${chip}. `;
    });
  }

  function openHistoryEntry(entry: ConsultationEntry) {
    setResult(entry.result);
    setError(null);
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteHistoryEntry(id: string) {
    if (isAuthorized) {
      deleteConsultation(Number(id));
    } else {
      setHistory((prev) => {
        const next = prev.filter((e) => e.id !== id);
        writeHistory(next);
        return next;
      });
    }
    setExpandedId((cur) => (cur === id ? null : cur));
  }

  return (
    <div className="bg-[#FAF9F6]">
      <Seo
        title="Plant Doctor — instant AI plant health diagnosis"
        description="Snap a photo of an unwell plant and get an instant AI diagnosis — disease, pests, watering or nutrient issues — with clear fixes and remedies available in India."
        url="plant-doctor"
      />
      <Breadcrumb
        className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8"
        items={[{ label: 'Home', href: Routes.home }, { label: 'Plant Doctor' }]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-[#ECECEC]">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#F3F8EC_0%,#FAF9F6_55%,#F4F1EA_100%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(ellipse,rgba(36,105,62,0.10)_0%,transparent_65%)]" />

        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-12 text-center sm:px-8 sm:pb-14 sm:pt-16">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#ECECEC] bg-white/80 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-[7px] w-[7px] shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#24693E] opacity-50" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#24693E]" />
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#B58E39]">
              AI Plant Doctor
            </span>
          </div>

          <h1 className="mt-6 text-[2.3rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#184A31] sm:text-[3.4rem]">
            Is your plant unwell?
            <br className="hidden sm:block" /> Find out in seconds.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5B5B5B]">
            Upload a photo of the leaves or describe the symptoms. Dr. Planty checks for disease,
            pests, over/under-watering and nutrient issues — and tells you exactly how to fix it.
          </p>

          {/* trust chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { icon: 'shield' as const, label: 'AI-powered diagnosis' },
              { icon: 'clock' as const, label: 'Results in seconds' },
              { icon: 'lock' as const, label: 'Photo not stored' },
            ].map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ECECEC] bg-white/85 px-3.5 py-1.5 text-[12px] font-medium text-[#24693E]"
              >
                <Icon name={c.icon} className="h-3.5 w-3.5" />
                {c.label}
              </span>
            ))}
          </div>

          {/* guided 3 steps */}
          <StepsStrip />
        </div>
      </section>

      {/* ── MAIN ── */}
      <section ref={mainRef} className="mx-auto max-w-5xl scroll-mt-24 px-5 py-10 sm:px-8 sm:py-14">
        {!enabled ? (
          <div className={`${CARD} p-10 text-center`}>
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F3F8EC] text-[#24693E]">
              <Icon name="leaf" className="h-7 w-7" />
            </span>
            <p className="text-[1.4rem] font-bold text-[#184A31]">Plant Doctor is coming soon</p>
            <p className="mt-2 text-[13.5px] text-[#8A8A8A]">
              We&rsquo;re putting the finishing touches on it. Check back shortly.
            </p>
          </div>
        ) : isLoading ? (
          <AnalyzingView preview={preview} />
        ) : result ? (
          result.is_plant === false ? (
            <RejectionView result={result} onReset={reset} />
          ) : (
            <DiagnosisView result={result} onReset={reset} />
          )
        ) : (
          <div className={`${CARD} p-5 sm:p-8`}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* ── upload zone ── */}
              <div>
                <label
                  htmlFor="pd-file"
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  className={`group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed text-center transition-all duration-200 ${
                    drag
                      ? 'border-[#24693E] bg-[#F3F8EC] shadow-[0_0_0_4px_rgba(36,105,62,0.12)]'
                      : preview
                        ? 'border-transparent'
                        : 'border-[#DCE8D3] bg-[#FAF9F6] hover:border-[#24693E]/60 hover:bg-[#F3F8EC]/60'
                  }`}
                >
                  {preview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Your plant" className="h-full w-full rounded-[16px] object-cover" />
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-8 text-[12px] font-semibold text-white">
                        <Icon name="camera" className="h-3.5 w-3.5" />
                        Tap to change photo
                      </span>
                    </>
                  ) : (
                    <span className="px-8">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-[#24693E] shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-transform duration-200 group-hover:scale-105">
                        <Icon name="camera" className="h-7 w-7" />
                      </span>
                      <span className="mt-4 block text-[17px] font-bold text-[#184A31]">
                        Add a photo of your plant
                      </span>
                      <span className="mt-1 block text-[12.5px] text-[#8A8A8A]">
                        Tap to upload or drag &amp; drop
                      </span>
                    </span>
                  )}
                </label>
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

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3.5 py-1.5 text-[12px] font-semibold text-[#24693E] transition hover:bg-[#E7EEE2]"
                  >
                    <Icon name="camera" className="h-3.5 w-3.5" />
                    Use camera
                  </button>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null); setImageB64(null);
                        if (fileRef.current) fileRef.current.value = '';
                        if (cameraRef.current) cameraRef.current.value = '';
                      }}
                      className="text-[12px] text-[#8A8A8A] underline underline-offset-2 transition hover:text-[#5B5B5B]"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                {/* photo tips */}
                <ul className="mt-4 space-y-1.5 rounded-[14px] bg-[#F7F5EF] px-4 py-3">
                  {['Use natural light — avoid flash', 'Focus on the affected leaves', 'Include the whole plant if you can'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-[12px] text-[#5B5B5B]">
                      <span className="text-[#24693E]">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── form ── */}
              <div className="flex flex-col">
                <label htmlFor="pd-name" className="text-[13px] font-semibold text-[#184A31]">
                  Plant name <span className="font-normal text-[#8A8A8A]">(optional)</span>
                </label>
                <input
                  id="pd-name"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="e.g. Money Plant, Tulsi, Snake Plant"
                  className="mt-1.5 rounded-[14px] border border-[#ECECEC] bg-white px-4 py-2.5 text-[13.5px] text-[#184A31] shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#B9B9B9] focus:border-[#24693E]/60 focus:ring-2 focus:ring-[#24693E]/15"
                />

                <label htmlFor="pd-symptoms" className="mt-5 text-[13px] font-semibold text-[#184A31]">
                  What&rsquo;s wrong? <span className="font-normal text-[#8A8A8A]">(optional)</span>
                </label>
                {/* quick symptom chips */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {SYMPTOM_CHIPS.map((chip) => {
                    const active = symptoms.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleSymptom(chip)}
                        aria-pressed={active}
                        className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                          active
                            ? 'border-[#14532D] bg-[#14532D] text-white'
                            : 'border-[#ECECEC] bg-white text-[#5B5B5B] hover:border-[#24693E]/50 hover:text-[#24693E]'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  id="pd-symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  placeholder="e.g. Leaves turning yellow with brown spots, drooping despite regular watering…"
                  className="mt-2.5 resize-none rounded-[14px] border border-[#ECECEC] bg-white px-4 py-2.5 text-[13.5px] text-[#184A31] shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#B9B9B9] focus:border-[#24693E]/60 focus:ring-2 focus:ring-[#24693E]/15"
                />

                {error && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-[14px] border border-[#E9B7AE] bg-[#FBE2DE] px-4 py-3">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-[#A23022]" />
                    <p className="text-[13px] text-[#A23022]">{error}</p>
                  </div>
                )}

                <button onClick={submit} disabled={isLoading} className={`${BTN_PRIMARY} mt-6`}>
                  <Icon name="leaf" className="h-4 w-4" />
                  Diagnose my plant
                </button>

                <p className="mt-3 text-[11.5px] leading-relaxed text-[#8A8A8A]">
                  Your photo is used only for this diagnosis and is not stored on our servers.
                  Results are AI-generated guidance.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── PREVIOUS CONSULTATIONS ──
          Client-only (auth + server fetch / localStorage) — rendered strictly
          after mount so server and first client render always match. Signed-in
          users see their account history from the API; per-entry delete goes to
          the server, so "Clear all" is local-mode only. */}
      {enabled && mounted && (
        <section className="mx-auto max-w-5xl px-5 pb-14 sm:px-8 sm:pb-20">
          {isAuthorized ? (
            <HistorySection
              entries={entries}
              loading={historyLoading}
              server
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
              onOpen={openHistoryEntry}
              onDelete={deleteHistoryEntry}
            />
          ) : (
            <HistoryLoginTeaser />
          )}
        </section>
      )}
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
