import Router from '@/compat/next-router';

/**
 * Navigate to the dedicated sign-in page (replaces the old login popup),
 * preserving where the user came from so they return after authenticating.
 * Uses the Router singleton so it works from any handler without a hook.
 */
export function goToSignin({ replace = false }: { replace?: boolean } = {}) {
  const from = Router.asPath;
  const redirect = from && !from.startsWith('/signin') ? from : undefined;
  const target = {
    pathname: '/signin',
    ...(redirect ? { query: { redirect } } : {}),
  };
  // A route GUARD should replace, not push: pushing leaves the gated page in
  // history, so Back lands on it, the guard fires again, and the user ping-pongs.
  // Explicit user actions ("Sign in" in the header) still push.
  return replace ? Router.replace(target) : Router.push(target);
}
