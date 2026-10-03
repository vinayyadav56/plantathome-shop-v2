import cn from 'classnames';

/** "Vinay Yadav" → "VY"; falls back to the email's first letter. */
function initialsOf(user: any): string {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length) return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  return (user?.email?.[0] ?? '?').toUpperCase();
}

/** The account's face: the uploaded photo, else initials on the brand green.
 *  Size comes from `className` (h-/w-/text-). Decorative: the name sits beside it. */
export default function UserAvatar({ user, className }: { user: any; className?: string }) {
  const src = user?.profile?.avatar?.thumbnail ?? user?.profile?.avatar?.original;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-ds-btn font-semibold tracking-wide text-white',
        className,
      )}
    >
      {initialsOf(user)}
    </span>
  );
}
