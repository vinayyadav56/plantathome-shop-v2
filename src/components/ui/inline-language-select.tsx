import { useRouter } from '@/compat/next-router';
import { languageMenu } from '@/lib/locals';
import Cookies from 'js-cookie';

/**
 * Compact inline language selector (a row of native-name pills) for the footer
 * + profile/settings. Reuses the same locale list (filtered to enabled locales)
 * and persistence as the first-visit popup, and switches instantly (no reload)
 * via Next i18n routing. Renders nothing when only one language is enabled.
 */
export default function InlineLanguageSelect({
  className = '',
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const router = useRouter();
  const { asPath, locale, locales } = router;
  const options = languageMenu.filter((m) => locales?.includes(m.id));
  if (options.length < 2) return null;

  function choose(value: string) {
    Cookies.set('NEXT_LOCALE', value, { expires: 365 });
    try {
      localStorage.setItem('pah_lang_chosen', value);
    } catch {
      /* ignore */
    }
    if (value !== locale) {
      router.push(asPath, undefined, { locale: value });
    }
  }

  const idle =
    tone === 'dark'
      ? 'text-[color:var(--g-band-ink-soft)] hover:text-white'
      : 'text-stone-500 hover:text-forest-700';
  const active =
    tone === 'dark'
      ? 'text-white font-semibold'
      : 'text-forest-700 font-semibold';

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className}`}>
      <i
        className={`fa-solid fa-language text-sm ${tone === 'dark' ? 'text-[color:var(--g-band-accent)]' : 'text-forest-600'}`}
        aria-hidden
      />
      {options.map((o, i) => (
        <span key={o.id} className="flex items-center gap-2.5">
          {i > 0 && (
            <span
              className={`h-3 w-px ${tone === 'dark' ? 'bg-[color:var(--g-band-hairline)]' : 'bg-kraft-300'}`}
              aria-hidden
            />
          )}
          <button
            type="button"
            onClick={() => choose(o.value)}
            lang={o.id}
            className={`font-hanken text-[12.5px] transition ${o.value === locale ? active : idle}`}
          >
            {o.name}
          </button>
        </span>
      ))}
    </div>
  );
}
