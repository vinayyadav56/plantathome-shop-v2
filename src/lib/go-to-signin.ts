import Router from '@/compat/next-router';

/**
 * Navigate to the dedicated sign-in page (replaces the old login popup),
 * preserving where the user came from so they return after authenticating.
 * Uses the Router singleton so it works from any handler without a hook.
 */
export function goToSignin() {
  const from = Router.asPath;
  const redirect = from && !from.startsWith('/signin') ? from : undefined;
  return Router.push({
    pathname: '/signin',
    ...(redirect ? { query: { redirect } } : {}),
  });
}
