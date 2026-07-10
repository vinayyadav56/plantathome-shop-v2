import { NextRequest, NextResponse } from 'next/server';

/** Guard the auth-only routes: without the httpOnly refresh cookie there is no
 *  session, so bounce to /login carrying a `next` for post-login return. The
 *  access token is minted client-side from the cookie on the destination page. */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!req.cookies.has('pah_refresh')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/account/:path*', '/orders/:path*'],
};
