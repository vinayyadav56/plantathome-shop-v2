import { useEffect, useState } from 'react';
import { useRouter } from '@/compat/next-router';
import { languageMenu } from '@/lib/locals';
import Cookies from 'js-cookie';

/**
 * First-visit language chooser. Shows ONCE — when no language preference is
 * stored yet (cookie NEXT_LOCALE / localStorage). Choice is remembered so it
 * never nags again (until the user resets it). Guests persist to cookie +
 * localStorage; the chosen locale also drives `Accept-Language` on API calls.
 *
 * Detection priority happens upstream (Next i18n localeDetection + the saved
 * cookie); this modal only appears on a genuine first visit with >1 language.
 */
const CHOICE_KEY = 'pah_lang_chosen';

export default function FirstVisitLanguageModal() {
  const router = useRouter();
  const { asPath, locale, locales } = router;
  const [open, setOpen] = useState(false);

  const options = languageMenu.filter((m) => locales?.includes(m.id));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only when multilingual is actually enabled (more than one locale).
    if (!locales || locales.length < 2) return;
    let chosen: string | undefined;
    try {
      chosen = Cookies.get('NEXT_LOCALE') || localStorage.getItem(CHOICE_KEY) || undefined;
    } catch {
      chosen = Cookies.get('NEXT_LOCALE');
    }
    if (!chosen) {
      const id = setTimeout(() => setOpen(true), 700); // let the page settle first
      return () => clearTimeout(id);
    }
  }, [locales]);

  function remember(value: string) {
    Cookies.set('NEXT_LOCALE', value, { expires: 365 });
    try {
      localStorage.setItem(CHOICE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function choose(value: string) {
    remember(value);
    setOpen(false);
    if (value !== locale) {
      router.push(asPath, undefined, { locale: value });
    }
  }

  function dismiss() {
    remember(locale || 'en');
    setOpen(false);
  }

  if (!open || options.length < 2) return null;

  const currentName = options.find((o) => o.value === locale)?.name || 'English';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={dismiss} aria-hidden />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-[radial-gradient(120%_120%_at_30%_0%,#1E4023,#16301A)] px-6 pb-5 pt-6 text-center">
          <i className="fa-solid fa-language mb-2 text-2xl text-[#8FD56F]" aria-hidden />
          <div className="font-pahserif text-2xl font-semibold leading-tight text-white">Choose your language</div>
          <div className="mt-1 font-hanken text-[12.5px] text-white/70">
            अपनी भाषा चुनें · உங்கள் மொழி
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 p-5">
          {options.map((o) => {
            const active = o.value === locale;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.value)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-forest-600 bg-sage-100'
                    : 'border-kraft-200 hover:border-forest-500 hover:bg-sage-100/60'
                }`}
              >
                <span className="grid h-7 w-7 place-items-center text-lg">{o.icon}</span>
                <span className="font-hanken text-[15px] font-semibold text-forest-900">{o.name}</span>
                {active && <i className="fa-solid fa-check ms-auto text-forest-600" aria-hidden />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="w-full border-t border-kraft-200 py-3 text-center font-hanken text-xs text-stone-500 transition hover:text-forest-700"
        >
          Continue in {currentName}
        </button>
      </div>
    </div>
  );
}
