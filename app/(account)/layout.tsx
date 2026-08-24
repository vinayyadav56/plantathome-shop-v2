import AccountShell from '@/app-shell/account-shell';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';

export const revalidate = 300;

/**
 * Shared layout for the account tabs. The Header now renders ABOVE each page's
 * own Hydrate, so this layout must hydrate SETTINGS + TYPES itself for the
 * header to SSR with data (loadGeneralData prefetches exactly those keys).
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      <AccountShell>{children}</AccountShell>
    </Hydrate>
  );
}
