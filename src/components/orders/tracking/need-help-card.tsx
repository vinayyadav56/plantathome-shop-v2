import { ClockIcon, MailIcon, PhoneIcon } from './icons';

/**
 * Sidebar support card; contact details come from admin settings with the
 * same fallbacks the footer uses.
 */
export default function NeedHelpCard({ settings }: { settings: any }) {
  const contact = settings?.contactDetails ?? {};
  const phone = contact?.contact || settings?.contactPhone || '+91 98765 43210';
  const email = contact?.emailAddress || settings?.contactEmail || 'hello@plantathome.in';

  return (
    <div
      id="need-help"
      className="scroll-mt-24 rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6"
    >
      <h3 className="mb-2 text-base font-semibold text-forest-900">Need Help?</h3>
      <p className="mb-4 text-[13px] leading-relaxed text-[#8C8A81]">
        We&rsquo;re here for you. Reach out to our support team for any assistance.
      </p>

      <ul className="space-y-3 text-[13px] font-medium text-forest-900">
        <li>
          <a href={`tel:${phone}`} className="flex items-center gap-3 transition-colors hover:text-[var(--ds-accent-ink,#2E5E2A)]">
            <PhoneIcon className="h-4 w-4 shrink-0 text-[var(--ds-accent,#4E8B31)]" />
            {phone}
          </a>
        </li>
        <li>
          <a href={`mailto:${email}`} className="flex items-center gap-3 transition-colors hover:text-[var(--ds-accent-ink,#2E5E2A)]">
            <MailIcon className="h-4 w-4 shrink-0 text-[var(--ds-accent,#4E8B31)]" />
            {email}
          </a>
        </li>
        <li className="flex items-center gap-3">
          <ClockIcon className="h-4 w-4 shrink-0 text-[var(--ds-accent,#4E8B31)]" />
          Mon - Sat: 9:00 AM - 7:00 PM
        </li>
      </ul>
    </div>
  );
}
