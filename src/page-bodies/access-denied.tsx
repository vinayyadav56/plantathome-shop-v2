'use client';

/* Client boundary for /access-denied — the AccessDenied component uses
   useTranslation, which cannot be invoked from a server page file. */
import AccessDenied from '@/components/common/access-denied';

export function PageBody() {
  return <AccessDenied />;
}
