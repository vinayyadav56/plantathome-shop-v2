/**
 * One safe, user-facing message out of any thrown API error.
 *
 * The old pattern — `const { response: { data } } = error ?? {}` — itself THREW inside
 * onError on a network failure (no `response`), and `toast.error(data?.message)` rendered
 * "undefined" when the body was an HTML 500 page. This never throws and never shows raw
 * markup; detailed errors stay in the console/network tab.
 */
export function getErrorMessage(
  error: any,
  fallback = 'Something went wrong — please try again.',
): string {
  const data = error?.response?.data;
  const msg = data?.message ?? data?.error ?? (typeof data === 'string' ? data : undefined);
  if (typeof msg === 'string' && msg.trim() && !/^\s*<(!DOCTYPE|html)/i.test(msg)) {
    return msg;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out — check your connection and try again.';
  }
  if (typeof error?.message === 'string' && /network/i.test(error.message)) {
    return 'Network error — check your connection and try again.';
  }
  return fallback;
}

/**
 * First message out of a BARE 422 field-error bag — {"field": ["msg"]} with no
 * `message` key (Laravel validation on order/address create). Returns undefined
 * for anything else so callers fall through to getErrorMessage.
 */
export function firstFieldError(error: any): string | undefined {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && !data.message) {
    return Object.values(data)
      .flat()
      .find((v): v is string => typeof v === 'string');
  }
  return undefined;
}
