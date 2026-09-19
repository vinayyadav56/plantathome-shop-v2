import Cookies from 'js-cookie';
import { AUTH_TOKEN_KEY, EMAIL_VERIFIED } from '@/lib/constants';
import { AUTH_COOKIE_OPTIONS } from '@/lib/cookie-options';
export function useToken() {
  return {
    /**
     * `remember` is what the sign-in checkbox actually does.
     *
     * Unchecked keeps today's 1 day. It is deliberately NOT a session cookie:
     * that would log out everyone who closes their browser and comes back the
     * same afternoon, which is a behaviour regression, not a feature.
     *
     * Checked is 30 days, and the server backs it — packages/marvel/config/
     * sanctum.php reads SANCTUM_EXPIRATION_MINUTES, which is unset, so personal
     * access tokens never expire. The cookie was the only ceiling.
     */
    setToken(token: string, remember = false) {
      Cookies.set(AUTH_TOKEN_KEY, token, {
        ...AUTH_COOKIE_OPTIONS,
        expires: remember ? 30 : 1,
      });
    },
    getToken() {
      return Cookies.get(AUTH_TOKEN_KEY);
    },
    removeToken() {
      Cookies.remove(AUTH_TOKEN_KEY);
    },
    hasToken() {
      const token = Cookies.get(AUTH_TOKEN_KEY);
      if (!token) return false;
      return true;
    },
    setEmailVerified(emailVerified: boolean | null) {
      Cookies.set(EMAIL_VERIFIED, JSON.stringify({ emailVerified }), AUTH_COOKIE_OPTIONS);
    },
    getEmailVerified() {
      const emailVerified = Cookies.get(EMAIL_VERIFIED);
      // Corrupt cookie → default, never throw.
      try {
        return emailVerified ? JSON.parse(emailVerified) : true;
      } catch {
        return true;
      }
    },
  };
}
