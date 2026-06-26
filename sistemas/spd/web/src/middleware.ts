import { NextRequest, NextResponse } from 'next/server'

const COOKIE_SESSAO = 'spd_token'

export function middleware(req: NextRequest) {
  const temSessao = Boolean(req.cookies.get(COOKIE_SESSAO)?.value)
  const ehLogin = req.nextUrl.pathname.startsWith('/login')

  if (!temSessao && !ehLogin) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (temSessao && ehLogin) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
