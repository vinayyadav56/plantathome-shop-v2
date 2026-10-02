import { ChevronDown } from '@/components/ui/icon';

/**
 * Mobile-collapse wrapper for account sections (profile annotation 2026-10-03:
 * the page was one long card stack; secondary sections now fold on phones).
 *
 * The content lives OUTSIDE the <details> (peer-open reveal) so that from lg
 * the toggle row simply disappears and children render plainly — a closed
 * <details> would otherwise hide its children on desktop too. No state, no JS.
 */
export default function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <div>
      <details open={defaultOpen} className="peer lg:hidden [&[open]_svg]:rotate-180">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-kraft-200 bg-light px-5 py-4 text-[15px] font-semibold text-heading shadow-sm [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown size={18} aria-hidden className="shrink-0 text-stone-400 transition-transform" />
        </summary>
      </details>
      <div className="mt-3 hidden peer-open:block lg:mt-0 lg:block">{children}</div>
    </div>
  );
}
